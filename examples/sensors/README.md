# Sensors / 感測器

<a href="../README.md">English index</a> · <a href="../README.zh-TW.md">繁中索引</a>

Connect the sensor required by each project to input port 1. Each project waits for sensor readiness before reading a value.

請將各專案所需的感測器接到輸入埠 1；每個專案都會先等待感測器就緒，再讀取數值。

## Projects / 專案

- [sensor-threshold](./sensor-threshold/) — Select display and sound feedback from one reading.／依一次讀值選擇顯示與聲音回饋。
- [sensor-sampling](./sensor-sampling/) — Sample the sensor four times in a finite loop.／在有限迴圈中取樣四次。
- [color-sensor](./color-sensor/) — Read a detected color in Color mode.／以 Color 模式讀取辨識到的顏色。
- [gyro-sensor](./gyro-sensor/) — Read a rotation angle in Angle mode.／以 Angle 模式讀取旋轉角度。
- [sensor-details](./sensor-details/) — Inspect name, type, mode, and a raw reading.／檢視名稱、類型、模式與原始讀值。
- [raw-and-mode](./raw-and-mode/) — Choose a mode then inspect a raw channel.／選擇模式並檢視原始通道。
- [i2c-registers](./i2c-registers/) — Read a documented I2C register.／讀取文件化的 I2C 暫存器。

## New lessons / 新課程

- [three-zone-light](./three-zone-light/) — Three-zone reflected light／三段反射光分類。
- [five-sample-average](./five-sample-average/) — Five-sample average／五次取樣平均。

## Clev3r topic counterparts / Clev3r 主題對照

- [rgb-function](./rgb-function/) — RGB function inputs／RGB 函式輸入
- [i2c-register-workbench](./i2c-register-workbench/) — I2C register workbench／I2C 暫存器工作台
- [mode-inspector](./mode-inspector/) — Sensor mode inspector／感測模式檢視器
- [raw-channel-dashboard](./raw-channel-dashboard/) — Raw channel dashboard／原始通道儀表板
- [touch-port-grid](./touch-port-grid/) — Touch sensor port grid／觸碰感測器埠格線
- [port-raw-access](./port-raw-access/) — Port-specific raw access／指定埠原始值存取
