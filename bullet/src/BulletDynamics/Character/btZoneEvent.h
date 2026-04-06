#ifndef BT_ZONE_EVENT_H
#define BT_ZONE_EVENT_H

enum btZoneEventType {
  ZONE_EVENT_SENSOR_ENTER = 0,
  ZONE_EVENT_SENSOR_LEAVE = 1,
  ZONE_EVENT_JUMP_PAD_TRIGGERED = 2,
  ZONE_EVENT_BOOST_ZONE_ENTER = 3,
  ZONE_EVENT_BOOST_ZONE_EXIT = 4,
  // Input-driven events: fired when the controller executes a jump or dash
  // from the current input state.  Zone ID is always -1 for these events.
  ZONE_EVENT_JUMP_FIRED = 5,
  ZONE_EVENT_DASH_FIRED = 6,
  ZONE_EVENT_DASH_TOKEN_COLLECTED = 7,
};

struct btZoneEvent {
  int m_zoneId;
  int m_eventType;
};

#endif // BT_ZONE_EVENT_H
