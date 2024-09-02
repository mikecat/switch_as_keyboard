#include <Keyboard.h>

int getStatus() {
  int status = 0;
  for (int i = 2; i <= 7; i++) {
    if (digitalRead(i) == LOW) status |= 1 << (i - 2);
  }
  return status;
}

void sendStatus(int status) {
  // prepare bit data
  unsigned char dataToSend[3];
  dataToSend[0] = 5;
  dataToSend[1] = (unsigned char)status;
  dataToSend[2] = -(dataToSend[0] + dataToSend[1]);
  // Base64-encode
  unsigned char dataToEncode[4];
  dataToEncode[0] = dataToSend[0] >> 2;
  dataToEncode[1] = ((dataToSend[0] << 4) | (dataToSend[1] >> 4)) & 0x3f;
  dataToEncode[2] = ((dataToSend[1] << 2) | (dataToSend[2] >> 6)) & 0x3f;
  dataToEncode[3] = dataToSend[2] & 0x3f;
  // send
  Keyboard.write(' ');
  for (int i = 0; i < 4; i++) {
    int d = dataToEncode[i];
    if (d < 26) Keyboard.write(d + 'A');
    else if (d < 52) Keyboard.write(d - 26 + 'a');
    else if (d < 62) Keyboard.write(d - 52 + '0');
    else if (d == 62) Keyboard.write(',');
    else Keyboard.write('.');
  }
}

int currentStatus;
unsigned long lastSendTime;
bool noSend;

void setup() {
  for (int i = 2; i <= 7; i++) {
    pinMode(i, INPUT_PULLUP);
  }
  Keyboard.begin();
  currentStatus = getStatus();
  noSend = false;
}

void loop() {
  unsigned long currentTime = millis();
  int nextStatus = getStatus();
  if (currentTime - lastSendTime >= 50) noSend = false;
  if (nextStatus != currentStatus && !noSend) {
    sendStatus(nextStatus);
    currentStatus = nextStatus;
    lastSendTime = currentTime;
    noSend = true;
  }
}
