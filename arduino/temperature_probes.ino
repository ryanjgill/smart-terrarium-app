#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoHttpClient.h>
#include <WiFi101.h>
#include <SimpleDHT.h>
// Using Pin 5 of MKR1000
#define ONE_WIRE_BUS_PIN 5
// TODO: Move out ot separate file
#define SECRET_SSID "SECRET_SSID"
#define SECRET_PASS "SECRET_PASS"
#define RIG_NAME "Gill"

char ssid[] = SECRET_SSID;
char pass[] = SECRET_PASS;

// Setup a oneWire instance for temperature probes
OneWire oneWire(ONE_WIRE_BUS_PIN);
// Pass our oneWire reference to Dallas Temperature.
DallasTemperature sensors(&oneWire);

// probe_a: "28 FF 2F 9C B0 16 3 34"
// probe_b: "28 FF 36 1E B1 16 4 4D"
// probe_c: "28 FF 27 1E B1 16 4 FC"
// probe_d: "28 FF 6A 74 B0 16 5 87"
// probe_e: "28 FF  E B5 B0 16 3 E2"

// Define device addresses for each probe
DeviceAddress Probe01 = {0x28, 0xFF, 0x2F, 0x9C, 0xB0, 0x16, 0x03, 0x34};
DeviceAddress Probe02 = {0x28, 0xFF, 0x36, 0x1E, 0xB1, 0x16, 0x04, 0x4D};
DeviceAddress Probe03 = {0x28, 0xFF, 0x27, 0x1E, 0xB1, 0x16, 0x04, 0xFC};
DeviceAddress Probe04 = {0x28, 0xFF, 0x6A, 0x74, 0xB0, 0x16, 0x05, 0x87};
DeviceAddress Probe05 = {0x28, 0xFF, 0x0E, 0xB5, 0xB0, 0x16, 0x03, 0xE2};

int uvSensor = A1;
int uvIndex = 0;

int pinDHT22 = A2;
SimpleDHT22 dht22(pinDHT22);

int soilSensor = A3;
int soilMoisture = 0;

char serverAddress[] = "192.168.86.127"; // raspberry pi address
int port = 3030;

WiFiClient wifi;
HttpClient client = HttpClient(wifi, serverAddress, port);
int status = WL_IDLE_STATUS;
String response;
int statusCode = 0;

void setup()
{
  // start serial port to show results
  Serial.begin(9600);
  delay(3000);

  pinMode(LED_BUILTIN, OUTPUT);

  while (status != WL_CONNECTED)
  {
    Serial.print("Attempting to connect to Network named: ");
    Serial.println(ssid); // print the network name (SSID);

    // Connect to WPA/WPA2 network:
    status = WiFi.begin(ssid, pass);
  }

  // print the SSID of the network you're attached to:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print your WiFi shield's IP address:
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  Serial.print("Initializing Temperature Control Library Version ");
  Serial.println(DALLASTEMPLIBVERSION);

  // Initialize the Temperature measurement library
  sensors.begin();

  // set the resolution to 10 bit (Can be 9 to 12 bits .. lower is faster)
  sensors.setResolution(Probe01, 9);
  sensors.setResolution(Probe02, 9);
  sensors.setResolution(Probe03, 9);
  sensors.setResolution(Probe04, 9);
  sensors.setResolution(Probe05, 9);
}

void loop() /****** LOOP: RUNS CONSTANTLY ******/
{
  Serial.println();
  Serial.print("Total Probes: ");
  Serial.println(sensors.getDeviceCount());

  // Command all devices on bus to read temperature
  sensors.requestTemperatures();

  float probeA = sensors.getTempC(Probe01);
  float probeB = sensors.getTempC(Probe02);
  float probeC = sensors.getTempC(Probe03);
  float probeD = sensors.getTempC(Probe04);
  float probeE = sensors.getTempC(Probe05);

  float moistureSensorValue = analogRead(soilSensor);
  soilMoisture = ((moistureSensorValue / 1024) - 1) * 100 * -1;

  float uvSensorValue = analogRead(uvSensor);
  uvIndex = uvSensorValue / 1024 * 3.3 / 0.1;

  Serial.print("Rig Name: ");
  Serial.println(String(RIG_NAME));

  Serial.print("ProbeA:  ");
  printTemperature(Probe01);
  Serial.println();

  Serial.print("ProbeB:  ");
  printTemperature(Probe02);
  Serial.println();

  Serial.print("ProbeC:  ");
  printTemperature(Probe03);
  Serial.println();

  Serial.print("ProbeD:  ");
  printTemperature(Probe04);
  Serial.println();

  Serial.print("ProbeE:  ");
  printTemperature(Probe05);
  Serial.println();

  Serial.print("soilMoisture:  ");
  Serial.print(soilMoisture);
  Serial.println();

  Serial.print("uvIndex:  ");
  Serial.print(uvIndex);
  Serial.println();

  byte temperature = 0;
  byte humidity = 0;
  int err = SimpleDHTErrSuccess;
  if ((err = dht22.read(&temperature, &humidity, NULL)) != SimpleDHTErrSuccess)
  {
    Serial.print("Read DHT22 failed, err=");
    Serial.println(err);
  }
  else
  {
    Serial.print("DHT22: ");
    Serial.print((int)temperature);
    Serial.print(" *C, ");
    Serial.print((int)humidity);
    Serial.println(" RH%");
  }

  String postURL = String("POST readings to " + String(serverAddress) + ':' + String(port));
  Serial.println(postURL);
  String contentType = "application/x-www-form-urlencoded";
  String postData = String(
      "probeA=" + String(probeA) +
      "&probeB=" + String(probeB) +
      "&probeC=" + String(probeC) +
      "&probeD=" + String(probeD) +
      "&probeE=" + String(probeE) +
      "&rig_name=" + String(RIG_NAME) +
      "&uvIndex=" + String(uvIndex) +
      "&soilMoisture=" + String(soilMoisture) +
      "&humidity=" + String(humidity) +
      "&temperature=" + String(temperature));

  digitalWrite(LED_BUILTIN, HIGH);
  client.post("/temperatures", contentType, postData);

  // read the status code and body of the response
  statusCode = client.responseStatusCode();
  response = client.responseBody();

  Serial.print("Status code: ");
  Serial.println(statusCode);
  Serial.print("Response: ");
  Serial.println(response);

  digitalWrite(LED_BUILTIN, LOW);
  delay(100);
  digitalWrite(LED_BUILTIN, HIGH);
  delay(100);
  digitalWrite(LED_BUILTIN, LOW);
  delay(100);
  digitalWrite(LED_BUILTIN, HIGH);
  delay(100);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}

// print temperature for device adress
void printTemperature(DeviceAddress deviceAddress)
{

  float tempC = sensors.getTempC(deviceAddress);

  if (tempC == -127.00)
  {
    Serial.print("Error getting temperature  ");
  }
  else
  {
    Serial.print(tempC, 1);
    Serial.print(" °C");
    // Serial.print(" F: ");
    // Serial.print(DallasTemperature::toFahrenheit(tempC));
  }
}