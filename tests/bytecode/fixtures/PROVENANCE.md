# Opcode schema fixture

`opcodes.json` records numeric opcode values and operand types parsed from the public LEGO EV3 firmware tables. It is independent of the compiler's opcode definitions and needs no download at test time. Firmware implementation source is not included.

Source: https://github.com/mindboards/ev3sources/tree/master/lms2012/lms2012/source

The array-lifetime tests use the `MAX_HANDLES = 250` limit in `lms2012.h` from the same public firmware source. `c_memory/source/c_memory.c` documents program-owned array allocation and explicit handle release; function return does not free those allocations.

The native call-alignment and thread-completion tests follow `CopyParsToLocals`, `CopyLocalsToPars`, `ObjectEnd`, and `ObjectChange` in `lms2012.c`: numeric parameters align to their storage width, and ending one object leaves other runnable objects alive. Test images are independently authored literal byte sequences.
