"""Python plugin runtime: JSON-RPC 2.0 over stdio with Content-Length framing."""
import asyncio
import inspect
import json
import os
import re
import sys
import threading

from ._framing import Decoder, FramingError, encode
from ._schema import SchemaError, Validator

API_VERSION = "1.0.0"
SDK_VERSION = "0.1.0"
_CANCELLED, _INVALID_PARAMS, _METHOD_NOT_FOUND, _INTERNAL = -32800, -32602, -32601, -32603
_CONTROL_CHARS = re.compile(r"[\u0000-\u001f\u007f]+")

# Reserve the original binary stdout immediately on import so top-level print() calls before
# Plugin() or plugin.run() go to stderr instead of corrupting the Content-Length stream.
_PROTOCOL_OUTPUT = getattr(sys.stdout, "buffer", None)
if _PROTOCOL_OUTPUT is not None and sys.stdout is not sys.stderr:
    sys.stdout = sys.stderr


def _task_key(request_id):
    return (type(request_id), request_id)


def _sanitize_error_message(text: str, fallback: str = "Plugin error") -> str:
    safe_utf8 = text.encode("utf-8", "replace").decode("utf-8")
    single_line = _CONTROL_CHARS.sub(" ", safe_utf8).strip()
    return (single_line or fallback)[:2000]


class RpcError(Exception):
    def __init__(self, code: int, message: str) -> None:
        super().__init__(message)
        self.code = code


class _Ui:
    def __init__(self, plugin: "Plugin") -> None:
        self._plugin = plugin

    async def show_message(self, message: str, severity: str = "info") -> None:
        await self._plugin._request("ui/showMessage", {"severity": severity, "message": message})


class CommandContext:
    def __init__(self, plugin: "Plugin") -> None:
        self.plugin_id = plugin.plugin_id
        self.locale = plugin.locale
        self.ui = _Ui(plugin)


class Plugin:
    def __init__(self) -> None:
        if sys.stdout is not sys.stderr:
            sys.stdout = sys.stderr
        self.plugin_id = ""
        self.locale = "en"
        self._commands = {}
        self._tasks = {}
        self._pending = {}
        self._next_id = 1
        self._validator = Validator.bundled()
        self._stopping = False

    def command(self, command_id: str):
        def register(handler):
            if not inspect.iscoroutinefunction(handler):
                raise TypeError("Kobrixa command handlers must be async functions.")
            self._commands[command_id] = handler
            return handler
        return register

    def run(self) -> None:
        output = (
            sys.stdout.buffer
            if sys.stdout is not sys.stderr and hasattr(sys.stdout, "buffer")
            else _PROTOCOL_OUTPUT
        )
        sys.stdout = sys.stderr
        asyncio.run(self._main(sys.stdin.fileno(), output))

    async def _main(self, source, output) -> None:
        self._loop = asyncio.get_running_loop()
        self._output = output
        queue: asyncio.Queue = asyncio.Queue()

        def read() -> None:
            decoder = Decoder()
            try:
                while True:
                    chunk = os.read(source, 65536)
                    if not chunk:
                        break
                    for text in decoder.push(chunk):
                        self._loop.call_soon_threadsafe(queue.put_nowait, text)
            except (FramingError, OSError) as error:
                print(f"kobrixa: stopped reading input: {error}", file=sys.stderr)
            finally:
                self._loop.call_soon_threadsafe(queue.put_nowait, None)

        threading.Thread(target=read, daemon=True).start()
        while not self._stopping:
            text = await queue.get()
            if text is None:
                break
            self._receive(text)
        self._stopping = True
        for task in list(self._tasks.values()):
            task.cancel()

    def _send(self, message: dict) -> None:
        if self._stopping:
            return
        try:
            payload = json.dumps(message, ensure_ascii=False, separators=(",", ":"))
            frame = encode(payload)
        except (FramingError, TypeError, ValueError) as error:
            print(f"kobrixa: dropped unencodable outgoing message: {error}", file=sys.stderr)
            return
        try:
            self._output.write(frame)
            self._output.flush()
        except (OSError, ValueError):
            self._stopping = True

    def _finished(self, request_id, method: str, task: "asyncio.Future") -> None:
        self._tasks.pop(_task_key(request_id), None)
        if task.cancelled():
            self._send({"jsonrpc": "2.0", "id": request_id,
                        "error": {"code": _CANCELLED, "message": f"{method} was cancelled."}})

    def _receive(self, text: str) -> None:
        try:
            message = json.loads(text)
            self._validator.validate("message", message)
        except (ValueError, SchemaError) as error:
            print(f"kobrixa: ignored invalid message from host: {error}", file=sys.stderr)
            return
        if "method" in message and "id" in message:
            request_id, method = message["id"], message["method"]
            task = asyncio.ensure_future(self._handle(message))
            self._tasks[_task_key(request_id)] = task
            task.add_done_callback(lambda done: self._finished(request_id, method, done))
        elif "method" in message:
            method = message["method"]
            if not self._validator.has(f"{method}.params"):
                print(f"kobrixa: ignored unknown notification {method}", file=sys.stderr)
                return
            try:
                self._validator.validate(f"{method}.params", message.get("params"))
            except SchemaError as error:
                print(f"kobrixa: ignored invalid notification {method}: {error}", file=sys.stderr)
                return
            if method == "$/cancelRequest":
                task = self._tasks.get(_task_key(message["params"]["id"]))
                if task:
                    task.cancel()
            elif method == "exit":
                self._stopping = True
        else:
            future = self._pending.pop(_task_key(message["id"]), None)
            if future and not future.done():
                future.set_result(message)

    async def _handle(self, message: dict) -> None:
        request_id, method = message["id"], message["method"]
        try:
            if not self._validator.has(f"{method}.params") or method == "ui/showMessage":
                raise RpcError(_METHOD_NOT_FOUND, f"Unknown method {method}.")
            params = message.get("params")
            try:
                self._validator.validate(f"{method}.params", params)
            except SchemaError as error:
                raise RpcError(_INVALID_PARAMS, f"Invalid parameters for {method}: {error}") from error
            result = await self._dispatch(method, params)
            self._send({"jsonrpc": "2.0", "id": request_id, "result": result})
        except asyncio.CancelledError:
            self._send({"jsonrpc": "2.0", "id": request_id,
                        "error": {"code": _CANCELLED, "message": f"{method} was cancelled."}})
        except RpcError as error:
            self._send({"jsonrpc": "2.0", "id": request_id,
                        "error": {"code": error.code, "message": _sanitize_error_message(str(error))}})
        except Exception as error:  # noqa: BLE001
            self._send({"jsonrpc": "2.0", "id": request_id,
                        "error": {"code": _INTERNAL, "message": _sanitize_error_message(str(error), type(error).__name__)}})

    async def _dispatch(self, method: str, params: dict):
        if method == "initialize":
            self.plugin_id, self.locale = params["pluginId"], params["locale"]
            return {"apiVersion": API_VERSION, "sdk": {"name": "kobrixa-plugin-sdk", "version": SDK_VERSION}}
        if method == "command/execute":
            handler = self._commands.get(params["command"])
            if handler is None:
                raise RpcError(_INVALID_PARAMS, f"The plugin did not register {params['command']}.")
            await handler(CommandContext(self))
            return None
        if method == "shutdown":
            return None
        raise RpcError(_METHOD_NOT_FOUND, f"Unknown method {method}.")

    async def _request(self, method: str, params: dict):
        self._validator.validate(f"{method}.params", params)
        request_id = self._next_id
        self._next_id += 1
        future = self._loop.create_future()
        self._pending[_task_key(request_id)] = future
        self._send({"jsonrpc": "2.0", "id": request_id, "method": method, "params": params})
        try:
            reply = await asyncio.wait_for(future, 10)
        finally:
            self._pending.pop(_task_key(request_id), None)
        if "error" in reply:
            raise RpcError(reply["error"]["code"], reply["error"]["message"])
        self._validator.validate(f"{method}.result", reply["result"])
        return reply["result"]
