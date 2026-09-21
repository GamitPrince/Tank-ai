/*
 * sensor_acquisition.cpp
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code replaces the Nucleo ADC acquisition and signal processing.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * Original Nucleo code: Core/Src/main.c (Read_ADC, ADC_To_Voltage,
 *                       Voltage_To_Current, Current_To_Level)
 *
 * IMPORTANT: The conversion equations are IDENTICAL to the Nucleo
 * implementation. Only the hardware ADC interface differs.
 *
 * ESP32 ADC differences from STM32:
 *   - ESP32 ADC is noisier → multi-sample averaging is used
 *   - ESP32 ADC has non-linearity at extremes → esp_adc_cal compensates
 *   - ESP32-S3 ADC attenuation must be configured for 0–3.3V range
 */

#include "sensor_acquisition.h"
#include "config.h"

#include <esp_adc_cal.h>

/* ADC calibration characteristics */
static esp_adc_cal_characteristics_t adc_chars;
static bool calibration_available = false;

/* ------------------------------------------------------------------ */
/*  Initialization                                                     */
/* ------------------------------------------------------------------ */

void SensorAcq_Init(void)
{
    /* Configure ADC resolution */
    analogReadResolution(SENSOR_ADC_RESOLUTION);

    /* Configure attenuation for 0–3.3V range */
    analogSetAttenuation(ADC_11db);

    /* Attempt ESP32 ADC calibration for better accuracy */
    esp_adc_cal_value_t cal_type = esp_adc_cal_characterize(
        ADC_UNIT_1,
        ADC_ATTEN_DB_12,
        ADC_WIDTH_BIT_12,
        1100,           /* Default Vref (mV) — overridden by eFuse if available */
        &adc_chars
    );

    if (cal_type == ESP_ADC_CAL_VAL_EFUSE_TP)
    {
        Serial.printf("%s ADC calibrated via eFuse Two Point\n", LOG_PREFIX_SENSOR);
        calibration_available = true;
    }
    else if (cal_type == ESP_ADC_CAL_VAL_EFUSE_VREF)
    {
        Serial.printf("%s ADC calibrated via eFuse Vref\n", LOG_PREFIX_SENSOR);
        calibration_available = true;
    }
    else
    {
        Serial.printf("%s ADC using default Vref (no eFuse calibration)\n", LOG_PREFIX_SENSOR);
        calibration_available = false;
    }

    Serial.printf("%s Sensor acquisition initialized (pin GPIO%d, %d-bit, %d samples)\n",
                  LOG_PREFIX_SENSOR, SENSOR_ADC_PIN, SENSOR_ADC_RESOLUTION, SENSOR_ADC_SAMPLES);
}

/* ------------------------------------------------------------------ */
/*  Raw ADC Reading (replaces Nucleo Read_ADC)                         */
/* ------------------------------------------------------------------ */

uint32_t SensorAcq_ReadADC(void)
{
    /*
     * Multi-sample averaging to reduce ESP32 ADC noise.
     * The Nucleo ADC reads a single sample (HAL_ADC_GetValue), but the
     * ESP32 ADC is significantly noisier, so we average SENSOR_ADC_SAMPLES
     * readings for comparable stability.
     */
    uint32_t sum = 0;

    for (int i = 0; i < SENSOR_ADC_SAMPLES; i++)
    {
        sum += analogRead(SENSOR_ADC_PIN);
    }

    return sum / SENSOR_ADC_SAMPLES;
}

/* ------------------------------------------------------------------ */
/*  ADC → Voltage (replaces Nucleo ADC_To_Voltage)                     */
/* ------------------------------------------------------------------ */

float SensorAcq_ADCToVoltage(uint32_t adc_raw)
{
    if (calibration_available)
    {
        /* Use ESP32 calibration for better accuracy */
        uint32_t voltage_mv = esp_adc_cal_raw_to_voltage(adc_raw, &adc_chars);
        return voltage_mv / 1000.0f;
    }

    /*
     * Fallback: same equation as Nucleo (Core/Src/main.c line 240):
     *   voltage = (adc * 3.3) / 4095.0
     */
    return (adc_raw * SENSOR_ADC_VREF) / SENSOR_ADC_MAX_COUNTS;
}

/* ------------------------------------------------------------------ */
/*  Voltage → Current (replaces Nucleo Voltage_To_Current)             */
/* ------------------------------------------------------------------ */

float SensorAcq_VoltageToCurrent(float voltage)
{
    /*
     * Identical to Nucleo (Core/Src/main.c line 245):
     *   current = 4.0 + (voltage * 16.0 / 3.3)
     *
     * This assumes a 250Ω sense resistor converting 4–20 mA
     * to approximately 1.0–5.0V, then scaled to 0–3.3V.
     */
    return CURRENT_MIN_MA + ((voltage * CURRENT_RANGE_MA) / SENSOR_ADC_VREF);
}

/* ------------------------------------------------------------------ */
/*  Current → Level (replaces Nucleo Current_To_Level)                 */
/* ------------------------------------------------------------------ */

float SensorAcq_CurrentToLevel(float current_ma)
{
    /*
     * Identical to Nucleo (Core/Src/main.c line 250):
     *   level = ((current - 4.0) * 100.0) / 16.0
     */
    return ((current_ma - CURRENT_MIN_MA) * LEVEL_MAX_PERCENT) / CURRENT_RANGE_MA;
}

/* ------------------------------------------------------------------ */
/*  Validity Check                                                     */
/* ------------------------------------------------------------------ */

bool SensorAcq_IsValid(float current_ma)
{
    /*
     * A 4–20 mA transmitter should never go below ~3.8 mA (wire break)
     * or above ~20.5 mA (sensor overrange). We use slightly wider bounds
     * to allow for measurement noise.
     */
    return (current_ma >= SENSOR_CURRENT_MIN_MA &&
            current_ma <= SENSOR_CURRENT_MAX_MA);
}

/* ------------------------------------------------------------------ */
/*  Full Acquisition Cycle                                              */
/* ------------------------------------------------------------------ */

sensor_reading_t SensorAcq_Read(void)
{
    sensor_reading_t reading;

    reading.adc_raw    = SensorAcq_ReadADC();
    reading.voltage    = SensorAcq_ADCToVoltage(reading.adc_raw);
    reading.current_ma = SensorAcq_VoltageToCurrent(reading.voltage);
    reading.level_pct  = SensorAcq_CurrentToLevel(reading.current_ma);
    reading.valid      = SensorAcq_IsValid(reading.current_ma);

    /* Clamp level to 0–100% range */
    if (reading.level_pct < 0.0f)   reading.level_pct = 0.0f;
    if (reading.level_pct > 100.0f) reading.level_pct = 100.0f;

    return reading;
}
