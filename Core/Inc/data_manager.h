/*
 * data_manager.h
 *
 *  Data Manager — receives raw sensor values, prepares telemetry records,
 *  manages sequence numbers, and dispatches data to the active transport.
 */

#ifndef __DATA_MANAGER_H
#define __DATA_MANAGER_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Initialize the Data Manager */
void DataManager_Init(void);

/* Process data manager tasks (retries, buffer management) */
void DataManager_Process(void);

/* Record new sensor readings and dispatch telemetry */
void DataManager_RecordReadings(uint16_t adc, float voltage, float current, float level, uint8_t relay);

#ifdef __cplusplus
}
#endif

#endif /* __DATA_MANAGER_H */
