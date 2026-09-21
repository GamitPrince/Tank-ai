/*
 * sensor_acquisition.h
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code replaces the Nucleo ADC acquisition and signal processing.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * Replaces Nucleo functions:
 *   Read_ADC()           → SensorAcq_ReadADC()
 *   ADC_To_Voltage()     → SensorAcq_ADCToVoltage()
 *   Voltage_To_Current() → SensorAcq_VoltageToCurrent()
 *   Current_To_Level()   → SensorAcq_CurrentToLevel()
 */

#ifndef TEMP_SENSOR_ACQUISITION_H
#define TEMP_SENSOR_ACQUISITION_H

#include <Arduino.h>
#include <stdint.h>

/* Sensor reading result */
typedef struct {
    uint32_t adc_raw;       /* Raw ADC count (0–4095) */
    float    voltage;       /* Converted voltage (V) */
    float    current_ma;    /* Converted current (mA) */
    float    level_pct;     /* Calculated level (%) */
    bool     valid;         /* True if reading is within expected range */
} sensor_reading_t;

/* Initialize the ADC and sensor acquisition subsystem */
void SensorAcq_Init(void);

/* Perform a full sensor acquisition cycle:
 *   ADC read → voltage → current → level
 * Returns all values in a sensor_reading_t struct. */
sensor_reading_t SensorAcq_Read(void);

/* Individual conversion functions (match Nucleo main.c exactly) */
uint32_t SensorAcq_ReadADC(void);
float    SensorAcq_ADCToVoltage(uint32_t adc_raw);
float    SensorAcq_VoltageToCurrent(float voltage);
float    SensorAcq_CurrentToLevel(float current_ma);

/* Validate that a current reading is within the expected 4–20 mA range */
bool     SensorAcq_IsValid(float current_ma);

#endif /* TEMP_SENSOR_ACQUISITION_H */
