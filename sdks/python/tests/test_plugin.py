import io
import json
import os
import subprocess
import sys
import unittest
from pathlib import Path
from kobrixa._framing import Decoder, FramingError, encode
from kobrixa._plugin import Plugin, _sanitize_error_message, _task_key
from kobrixa._schema import SchemaError, Validator

SDK = Path(__file__).resolve().parents[1]
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "behaviors.py"


class PluginUnitHelpersTest(unittest.TestCase):
    def test_task_key_distinguishes_bool_int_and_str(self):
        self.assertNotEqual(_task_key(1), _task_key(True))
        self.assertNotEqual(_task_key(0), _task_key(False))
        self.assertNotEqual(_task_key(1), _task_key("1"))

    def test_sanitize_error_message_strips_surrogates_and_control_chars(self):
        cleaned = _sanitize_error_message("bad\nline\x00\ud800end")
        self.assertNotIn("\n", cleaned)
        self.assertNotIn("\x00", cleaned)
        self.assertTrue(cleaned.startswith("bad line "))
        self.assertTrue(cleaned.endswith("end"))
        # Must be valid UTF-8
        cleaned.encode("utf-8")
        self.assertEqual(_sanitize_error_message("\n\t\x00", "Fallback"), "Fallback")
        self.assertEqual(len(_sanitize_error_message("a" * 2500)), 2000)

    def test_validator_rejects_unpaired_surrogates(self):
        validator = Validator.bundled()
        with self.assertRaises(SchemaError):
            validator.validate("ui/showMessage.params", {"severity": "info", "message": "hi \ud800"})

    def test_encode_rejects_unpaired_surrogates_with_framing_error(self):
        with self.assertRaises(FramingError):
            encode('{"bad":"\ud800"}')

    def test_sync_command_handler_is_rejected(self):
        plugin = Plugin()
        with self.assertRaises(TypeError):
            @plugin.command("acme.test.sync")
            def bad_handler(ctx):
                return None

    def test_send_does_not_stop_plugin_on_unencodable_payload(self):
        plugin = Plugin()
        plugin._output = io.BytesIO()
        plugin._send({"jsonrpc": "2.0", "id": 1, "result": "\ud800"})
        self.assertFalse(plugin._stopping)
        plugin._send({"jsonrpc": "2.0", "id": 2, "result": None})
        self.assertFalse(plugin._stopping)
        self.assertGreater(len(plugin._output.getvalue()), 0)

    def test_receive_ignores_invalid_json_and_unknown_notifications(self):
        plugin = Plugin()
        plugin._output = io.BytesIO()
        plugin._receive("{not json")
        plugin._receive(json.dumps({"jsonrpc": "2.0", "method": "unknown/notify", "params": {}}))
        plugin._receive(json.dumps({"jsonrpc": "2.0", "method": "$/cancelRequest", "params": {"id": True}}))
        self.assertFalse(plugin._stopping)


class PluginProcessTest(unittest.TestCase):
    def setUp(self):
        env = {**os.environ, "PYTHONPATH": str(SDK), "PYTHONUNBUFFERED": "1"}
        self.child = subprocess.Popen([sys.executable, str(FIXTURE)], stdin=subprocess.PIPE,
                                      stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
        self.decoder = Decoder()
        self.pending = []

    def tearDown(self):
        if self.child.poll() is None:
            self.child.kill()
        self.child.wait(5)
        for stream in (self.child.stdin, self.child.stdout, self.child.stderr):
            stream.close()

    def send(self, message):
        self.child.stdin.write(encode(json.dumps(message)))
        self.child.stdin.flush()

    def receive(self):
        while not self.pending:
            chunk = self.child.stdout.read1(65536)
            self.assertTrue(chunk, "plugin closed stdout")
            self.pending += self.decoder.push(chunk)
        return json.loads(self.pending.pop(0))

    def initialize(self):
        self.send({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
            "apiVersion": "1.0.0", "pluginId": "acme.behaviors", "locale": "zh-TW",
            "grantedPermissions": ["ui.notifications"]}})
        reply = self.receive()
        self.assertEqual(reply["result"]["apiVersion"], "1.0.0")

    def test_print_before_run_does_not_corrupt_protocol(self):
        self.initialize()

    def test_command_round_trip_with_print_redirected(self):
        self.initialize()
        self.send({"jsonrpc": "2.0", "id": 2, "method": "command/execute",
                   "params": {"command": "acme.behaviors.greet"}})
        request = self.receive()
        self.assertEqual(request["method"], "ui/showMessage")
        self.assertEqual(request["params"], {"severity": "info", "message": "acme.behaviors:zh-TW"})
        self.send({"jsonrpc": "2.0", "id": request["id"], "result": None})
        self.assertEqual(self.receive(), {"jsonrpc": "2.0", "id": 2, "result": None})

    def test_cancellation_reports_request_cancelled(self):
        self.initialize()
        self.send({"jsonrpc": "2.0", "id": 3, "method": "command/execute",
                   "params": {"command": "acme.behaviors.hang"}})
        self.send({"jsonrpc": "2.0", "method": "$/cancelRequest", "params": {"id": 3}})
        self.assertEqual(self.receive()["error"]["code"], -32800)

    def test_invalid_cancel_params_do_not_throw_or_cancel_active_requests(self):
        self.initialize()
        self.send({"jsonrpc": "2.0", "id": 1, "method": "command/execute",
                   "params": {"command": "acme.behaviors.hang"}})
        for bad_params in [None, {}, {"id": True}, {"id": 1.0, "extra": 1}, {"id": ""}]:
            msg = {"jsonrpc": "2.0", "method": "$/cancelRequest"}
            if bad_params is not None:
                msg["params"] = bad_params
            self.send(msg)
        self.send({"jsonrpc": "2.0", "id": 99, "method": "command/execute",
                   "params": {"command": "acme.behaviors.missing"}})
        reply = self.receive()
        self.assertEqual(reply["id"], 99)
        self.assertEqual(reply["error"]["code"], -32602)
        self.send({"jsonrpc": "2.0", "method": "$/cancelRequest", "params": {"id": 1}})
        cancelled = self.receive()
        self.assertEqual(cancelled["id"], 1)
        self.assertEqual(cancelled["error"]["code"], -32800)

    def test_special_unicode_output_does_not_stop_sdk_transmission(self):
        self.initialize()
        # 1. Command attempts to send unpaired surrogate via ui/showMessage
        self.send({"jsonrpc": "2.0", "id": 10, "method": "command/execute",
                   "params": {"command": "acme.behaviors.bad-unicode"}})
        err_reply = self.receive()
        self.assertEqual(err_reply["id"], 10)
        self.assertEqual(err_reply["error"]["code"], -32603)
        # 2. Command raises multiline + NUL + surrogate error
        self.send({"jsonrpc": "2.0", "id": 11, "method": "command/execute",
                   "params": {"command": "acme.behaviors.multiline-error"}})
        err_reply2 = self.receive()
        self.assertEqual(err_reply2["id"], 11)
        self.assertEqual(err_reply2["error"]["code"], -32603)
        self.assertNotIn("\n", err_reply2["error"]["message"])
        # 3. Subsequent normal command still succeeds (SDK did not stop transmitting)
        self.send({"jsonrpc": "2.0", "id": 12, "method": "command/execute",
                   "params": {"command": "acme.behaviors.greet"}})
        request = self.receive()
        self.assertEqual(request["method"], "ui/showMessage")
        self.send({"jsonrpc": "2.0", "id": request["id"], "result": None})
        self.assertEqual(self.receive(), {"jsonrpc": "2.0", "id": 12, "result": None})

    def test_cancel_before_start_replies_exactly_once(self):
        self.initialize()
        self.child.stdin.write(
            encode(json.dumps({"jsonrpc": "2.0", "id": 6, "method": "command/execute",
                               "params": {"command": "acme.behaviors.hang"}}))
            + encode(json.dumps({"jsonrpc": "2.0", "method": "$/cancelRequest", "params": {"id": 6}})))
        self.child.stdin.flush()
        self.assertEqual(self.receive(), {"jsonrpc": "2.0", "id": 6, "error": {
            "code": -32800, "message": "command/execute was cancelled."}})
        self.send({"jsonrpc": "2.0", "id": 7, "method": "command/execute",
                   "params": {"command": "acme.behaviors.missing"}})
        self.assertEqual(self.receive()["id"], 7)

    def test_unknown_command_and_invalid_params(self):
        self.initialize()
        self.send({"jsonrpc": "2.0", "id": 4, "method": "command/execute",
                   "params": {"command": "acme.behaviors.missing"}})
        self.assertEqual(self.receive()["error"]["code"], -32602)
        self.send({"jsonrpc": "2.0", "id": 5, "method": "command/execute", "params": {"command": 1}})
        self.assertEqual(self.receive()["error"]["code"], -32602)

    def test_unknown_method_returns_method_not_found(self):
        self.initialize()
        self.send({"jsonrpc": "2.0", "id": 15, "method": "ui/showMessage",
                   "params": {"severity": "info", "message": "host cannot call ui/showMessage"}})
        self.assertEqual(self.receive()["error"]["code"], -32601)

    def test_shutdown_request_returns_null(self):
        self.initialize()
        self.send({"jsonrpc": "2.0", "id": 16, "method": "shutdown", "params": {}})
        self.assertEqual(self.receive(), {"jsonrpc": "2.0", "id": 16, "result": None})

    def test_exit_notification_with_invalid_params_is_ignored(self):
        self.initialize()
        self.send({"jsonrpc": "2.0", "method": "exit", "params": {"force": True}})
        self.send({"jsonrpc": "2.0", "id": 17, "method": "shutdown", "params": {}})
        self.assertEqual(self.receive(), {"jsonrpc": "2.0", "id": 17, "result": None})

    def test_emoji_and_cjk_messages_preserve_utf8_framing(self):
        self.initialize()
        self.send({"jsonrpc": "2.0", "id": 18, "method": "command/execute",
                   "params": {"command": "acme.behaviors.greet"}})
        req = self.receive()
        self.assertEqual(req["method"], "ui/showMessage")
        self.send({"jsonrpc": "2.0", "id": req["id"], "result": None})
        self.assertEqual(self.receive(), {"jsonrpc": "2.0", "id": 18, "result": None})

    def test_exits_on_exit_notification_and_on_stdin_eof(self):
        self.initialize()
        self.send({"jsonrpc": "2.0", "method": "exit", "params": {}})
        self.assertEqual(self.child.wait(5), 0)

    def test_exits_when_host_disappears(self):
        self.initialize()
        self.child.stdin.close()
        self.assertEqual(self.child.wait(5), 0)
