# Tank Monitoring Platform --- Requirements & Features

## 1. Inventory Volume

-   Calculate inventory volume for:
    -   The whole plant
    -   A particular tank
    -   An individual tank
    -   The whole industry
-   The volume displayed should depend on the user's access level.

## 2. Historical Consumption Pattern

-   Provide historical consumption patterns.
-   Access to historical data should depend on the user's access level.

------------------------------------------------------------------------

# 3. Tank Features

## 3.1 Sensor Agreement Check

The tank has two level sensors operating at different low levels, with a
region where both sensors measure up to the high-high level.

If the difference between the two sensor readings changes drastically,
the system should generate appropriate alerts.

### Required Actions

1.  **Sensor Mismatch Alarm**
    -   Generate an alarm when the difference between the two level
        sensor readings exceeds the configured tolerance.
2.  **Sensor Health Warning**
    -   Perform a periodic difference check between the two sensors.
    -   If the difference is initially stable but increases over a
        period of time, generate a sensor health warning.
3.  **Operator Check**
    -   If both sensors are otherwise working normally but there is a
        sudden difference between their readings, generate an alert
        indicating that an equipment failure may be present.
    -   This should prompt an operator to inspect the equipment.
4.  **Maintenance Recommendation**
    -   Provide a maintenance recommendation when persistent or abnormal
        sensor differences indicate that maintenance may be required.

------------------------------------------------------------------------

# 4. Multi-Industry Access and Database Requirements

## 4.1 Industry Data Isolation

-   The platform will support multiple industries.
-   Each industry must have separate access to its data.
-   One industry's users must not be able to access another industry's
    data.
-   The database architecture must enforce this separation.

## 4.2 Industry Admin Panel

There should be an admin panel for each industry where the administrator
can:

-   Manage users.
-   Define user access levels.
-   Assign access based on organizational hierarchy.
-   Manage access to different numbers of tanks.

Example access levels include:

-   Plant Manager
-   Area Manager
-   Other user roles as required

Different users may have access to different numbers of tanks.

## 4.3 Platform Software Administration

There should be a separate administrator for the overall software
platform.

The platform administrator should be able to:

-   Create industries.
-   Provide access to users.
-   Configure nodes/boards.
-   View the status of nodes/boards.

------------------------------------------------------------------------

# 5. Naming System

There should be a standardized naming system for uniquely identifying:

-   Nucleo boards
-   Tanks
-   Plants
-   Industries

The naming system should allow each Nucleo board to be uniquely
associated with its respective tank, plant, and industry.

------------------------------------------------------------------------

# 6. Tank Dashboard Status

The tank dashboard should display the following information:

1.  **Radar Level Sensor Reading**
2.  **Pressure Level Sensor Reading**
3.  **High-High Level Indicator / Alert**
    -   Threshold is set by the industry.
4.  **Low-Low Level Indicator / Alert**
    -   Threshold is set by the industry.
5.  **Inlet Valve Status**
    -   ON / OFF
6.  **Outlet Valve Status**
    -   ON / OFF
7.  **Product Temperature**
    -   Temperature sensors may be located at different positions within
        the same tank.
8.  **Filling Rate**
9.  **Emptying Rate**

------------------------------------------------------------------------

# 7. Summary of Requirements

The tank monitoring platform should provide:

-   Multi-industry support with strict data isolation.
-   Industry-level administration.
-   Platform-level administration.
-   Role-based and tank-level access control.
-   Unique identification of industries, plants, tanks, and Nucleo
    boards.
-   Monitoring of two independent level sensors.
-   Sensor agreement and sensor health monitoring.
-   Sensor mismatch alarms.
-   Operator alerts for sudden discrepancies.
-   Maintenance recommendations.
-   Radar and pressure level readings.
-   Configurable High-High and Low-Low level alerts.
-   Inlet and outlet valve status.
-   Multi-point product temperature monitoring.
-   Filling and emptying rate calculations.
-   Inventory volume calculations according to user access level.
-   Historical consumption information according to user access level.
