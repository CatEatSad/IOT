#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Định nghĩa các chân kết nối
#define DHTPIN 4        // Cổng DHT11
#define DHTTYPE DHT11   // Cảm biến DHT11
#define LDR_PIN 34      // Cổng quang trở (LDR)
#define LED1_PIN 18     // LED 1
#define LED2_PIN 19     // LED 2
#define LED3_PIN 21     // LED 3
#define LED4_PIN 22      // LED 4
// Cấu hình WiFi và MQTT broker
const char* ssid = "Redmi Note 11T Pro";
const char* password = "1234567t";
const char* mqtt_server = "192.168.142.52";
const int mqtt_port = 1883;
const char* mqtt_user = "admin";
const char* mqtt_password = "admin";

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);

// Biến lưu trạng thái trước đó của các LED
bool previousStateLED2 = LOW;
bool previousStateLED3 = LOW;
bool previousStateLED4 = LOW;

void setup() {
  Serial.begin(9600);

  // Thiết lập các chân LED là OUTPUT
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(LED3_PIN, OUTPUT);
  pinMode(LED4_PIN, OUTPUT);
  // Khởi tạo cảm biến DHT
  dht.begin();

  // Kết nối WiFi
  setup_wifi();

  // Kết nối tới MQTT broker
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void setup_wifi() {
  delay(10);
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
}

void reconnect() {
  while (!client.connected()) {
    Serial.println("Connecting to MQTT...");
    if (client.connect("ESP32Client", mqtt_user, mqtt_password)) {
      Serial.println("Connected to MQTT broker");
      client.subscribe("esp32/devices_control");
    } else {
      Serial.print("Failed to connect, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload, length);
    if (error) {
        Serial.print("Failed to parse JSON: ");
        Serial.println(error.f_str());
        return;
    }

    const char* led4 = doc["Fan"];
    const char* led2 = doc["Air Conditioner"];
    const char* led3 = doc["Light"];
    bool newLED2State, newLED3State, newLED4State;

    if (led4 != nullptr) {
        newLED4State = (strcmp(led4, "ON") == 0);
        if (newLED4State != previousStateLED4) {
            digitalWrite(LED4_PIN, newLED4State ? HIGH : LOW);
            previousStateLED4 = newLED4State;

            String payload_pub = "{\"Fan\":\"" + String(led4) + "\"}";
            client.publish("esp32/devices_control/confirmed", payload_pub.c_str());
        }
    }
    

    // Điều khiển và cập nhật LED2 (Air Conditioner)
    if (led2 != nullptr) {
        newLED2State = (strcmp(led2, "ON") == 0);
        if (newLED2State != previousStateLED2) {
            digitalWrite(LED2_PIN, newLED2State ? HIGH : LOW);
            previousStateLED2 = newLED2State;

            String payload_pub = "{\"Air Conditioner\":\"" + String(led2) + "\"}";
            client.publish("esp32/devices_control/confirmed", payload_pub.c_str());
        }
    }

    // Điều khiển và cập nhật LED3 (Light)
    if (led3 != nullptr) {
        newLED3State = (strcmp(led3, "ON") == 0);
        if (newLED3State != previousStateLED3) {
            digitalWrite(LED3_PIN, newLED3State ? HIGH : LOW);
            previousStateLED3 = newLED3State;
            String payload_pub = "{\"Light\":\"" + String(led3) + "\"}";
            client.publish("esp32/devices_control/confirmed", payload_pub.c_str());
        }
    }

    Serial.print("Message received on topic: ");
    Serial.print(topic);
    Serial.print(". JSON: ");
    serializeJson(doc, Serial);
    Serial.println();
}

// Hàm chuyển đổi từ giá trị LDR sang lux
float ldrToLux(int ldrValue) {
  float voltage = (ldrValue / 4095.0) * 3.3;
  float lux = 500 * pow(voltage, -1.5);
  return lux;
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Đọc dữ liệu từ DHT11
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  int ldrValue = analogRead(LDR_PIN);
  float lux = ldrToLux(ldrValue);
  
  long windspeed = random(0, 101); // Giá trị ngẫu nhiên trong khoảng từ 0 đến 100

  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // In dữ liệu ra Serial
  Serial.print("Humidity: ");
  Serial.print(h);
  Serial.print("%  Temperature: ");
  Serial.print(t);
  Serial.print("°C  Lux: ");
  Serial.print(lux);
  Serial.print("  Windspeed: ");
  Serial.println(windspeed);
  
  // Tạo chuỗi JSON cho dữ liệu sensor
  String payload = "{\"humidity\":" + String(h) + 
                   ",\"temperature\":" + String(t) + 
                   ",\"lux\":" + String(lux) + 
                   ",\"windspeed\":" + String(windspeed) + "}";

  // Đẩy dữ liệu JSON lên MQTT
  client.publish("esp32/sensor_data", payload.c_str());

  // Nếu windspeed >= 60 thì nháy LED1
  if (windspeed >= 60) {
    for(int i = 0; i < 3; i++) {  // Lặp 3 lần
        digitalWrite(LED1_PIN, HIGH);  // Bật LED1
        delay(500);                    // Chờ 500ms
        digitalWrite(LED1_PIN, LOW);   // Tắt LED1
        delay(500);                    // Chờ 500ms
    }
} else {
    digitalWrite(LED1_PIN, LOW);   // Tắt LED1 nếu windspeed < 60
}

  // Gửi dữ liệu mỗi 2 giây
  delay(2000);
}
