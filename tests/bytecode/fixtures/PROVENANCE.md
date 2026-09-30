# Opcode schema fixture

`opcodes.json` records numeric opcode values and operand types parsed from the public LEGO EV3 firmware tables. It is independent of the compiler's opcode definitions and needs no download at test time. Firmware implementation source is not included.

Source: https://github.com/mindboards/ev3sources/tree/master/lms2012/lms2012/source

The array-lifetime tests use the `MAX_HANDLES = 250` limit in `lms2012.h` from the same public firmware source. `c_memory/source/c_memory.c` documents program-owned array allocation and explicit handle release; function return does not free those allocations.

The native call-alignment and thread-completion tests follow `CopyParsToLocals`, `CopyLocalsToPars`, `ObjectEnd`, and `ObjectChange` in `lms2012.c`: numeric parameters align to their storage width, and ending one object leaves other runnable objects alive. Test images are independently authored literal byte sequences.

I2C scenarios specify bytes in wire order. The VM models positive `RDLNG` replies in reverse buffer order, as documented by `IIC_SETUP` and `IIC_READING` in the [public EV3 I2C driver](https://github.com/mindboards/ev3sources/blob/master/lms2012/d_iic/Linuxmod_AM1808/d_iic.c). The compiler restores wire order before returning BASIC PLUS arrays. Pixy2 register layouts are checked against `lego_getData` in the [manufacturer's firmware](https://github.com/charmedlabs/pixy2/blob/master/src/device/main_m4/src/serial.cpp); fixture values and BASIC PLUS programs are independently authored.
