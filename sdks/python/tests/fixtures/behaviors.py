from kobrixa import Plugin
import asyncio
import os

# Regression test: print() before Plugin() and before plugin.run() must never corrupt stdout protocol
print("import-time print before Plugin() must go to stderr")

plugin = Plugin()

print("setup-time print before plugin.run() must also go to stderr")


@plugin.command("acme.behaviors.greet")
async def greet(ctx):
    print("debug output must not corrupt the protocol")
    await ctx.ui.show_message(f"{ctx.plugin_id}:{ctx.locale}")


@plugin.command("acme.behaviors.hang")
async def hang(ctx):
    await asyncio.sleep(3600)


@plugin.command("acme.behaviors.bad-unicode")
async def bad_unicode(ctx):
    await ctx.ui.show_message("unpaired surrogate: \ud800")


@plugin.command("acme.behaviors.multiline-error")
async def multiline_error(ctx):
    raise RuntimeError("line1\nline2\u0000\ud800")


@plugin.command("acme.behaviors.crash")
async def crash(ctx):
    os._exit(3)


if __name__ == "__main__":
    plugin.run()
