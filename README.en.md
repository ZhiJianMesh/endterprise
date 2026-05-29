# Zhijian Mesh Service Repository
Zhijian Mesh is committed to providing various edge cloud services for small and medium-sized enterprises. Even using an old Android phone or a Raspberry Pi, private cloud deployment can be achieved. As long as you know how to download and install a mobile app, you can install your own cloud service. Deploy the service in the enterprise's own private environment, and as long as there is a fixed public IP or intranet penetration is achieved, the service can be accessed across the entire network.

## Introduction
This repository hosts the source code and corresponding release versions of various services provided by Zhijian Mesh for small and medium-sized enterprises. 
Zhijian Mesh is committed to the following four aspects, striving to simplify the cost of application, development, and maintenance of enterprise services:


### 1. Easy to use, greatly reducing deployment and operation costs
It is extremely expensive for enterprises to maintain independent IT development and operations teams. Using Zhijian Mesh, you can install and configure complex enterprise applications just like using a common mobile app. 
An **old Android phone, Raspberry Pi**, etc., can run the services. Of course, it can also run on a PC, and in cloud environments such as Alibaba Cloud and Huawei Cloud, multi-active deployment across data centers and cross-city backup are supported. 
The client-side program supports **Android/HarmonyOS, Windows** systems.

### 2. Reducing code size
Code is cost. Most service release packages are less than 100KB. Basic services such as **accounts, workflows, configuration, scheduled tasks, keystore, oAuth2 authentication** are built into the release package, providing interface-level authentication and authorization (RBAC, ABAC), which greatly reduces development workload. 
For example, the integrated finance and business CRM service has about 3,000 lines of code for the service interface and another 3,000 for the UI, totaling about 7,000 lines. Yet its functionality is not rudimentary: it implements customer and contact management, order, service, and payment electronic flow tracking, linking sales activities with warehousing and finance. 
The system has a built-in workflow service, allowing process management and data authorization by process.

### 3. Solving customization problems
Enterprise services are closely tied to business processes, which vary greatly, so customization is common. 
Zhijian Mesh interfaces are implemented using JSON configuration and minimal JS snippets, making modifications very easy. 
The UI part is based on vue+quasar, easy to understand and customize. 
All business code is open-sourced under APL license, allowing free customization and modification without legal or commercial risks.

### 4. High reliability and high security
Zhijian Mesh is designed with the reliability and security standards of large internet companies, embedding reliability and security at the bottom layer. 
1. System reliability - natively supports multi-instance clusters, multi-data center deployment, and cross-city backup. 
2. Data reliability - provides daily remote encrypted backup of data. Even in extreme situations such as earthquakes or fires, at most one day of data will be lost. 
3. Data security - while ensuring ease of use, the security of data storage and transmission has been carefully designed. Sensitive fields in the database, such as phone numbers, can be encrypted in business operations, and keys are automatically rotated periodically without any additional work. 
4. Transmission security - communication between services and between client and cloud uses the HTTPS protocol.

---
## Software Architecture
The server-side core is primarily implemented in Java with some C code. Enterprise services use JSON configuration to implement interfaces. 
The client side uses web-based UI(vue+quasar) to simplify development difficulty, with a user experience indistinguishable from native implementations. The Windows and Android clients maintain the same operational experience.

## Installation Method
### Server-side Installation
1. If use the Android version of the server. Install and set it up like a normal Android app. On the home page of the service program, click the red button to start the server. 
2. For public cloud or private cloud cluster deployment, please contact us. 
3. After installing the service program, open its built-in app store to download the required services. 
4. Enable the cloud data backup feature; data will be automatically encrypted and backed up once a day. 
5. For public cloud deployment, or private cloud with a fixed public IP, global access is possible. 
6. For private cloud without a fixed public IP, use a dynamic DNS service like Peanut Shell to achieve external network penetration. IPv6+UPnP can also achieve external network penetration, but it is not stable. 

### Client-side Installation
#### One-click Installation
Download and install the client application. Android and Windows versions are provided. The usage method is identical across different operating systems. 

#### Two-step Access
1. Add a company in "Settings", enter the company ID and company access code. 
This step is similar to connecting to Wi-Fi (company ID corresponds to Wi-Fi SSID, company access code corresponds to Wi-Fi password). 
One client can connect to multiple companies, supporting multi-company "moonlighting mode". 
2. Click the "Login" button in the upper right corner, enter the account and password assigned by the company to log into the company system. 
This step is similar to logging into a QQ system after connecting to Wi-Fi. After that, you can operate the company's business software.

----
# More Information
Please visit http://www.zhijian.net.cn. The website contains user guides for the server and client, as well as service development guidance.

# Contributing
Using Zhijian Mesh and providing suggestions or new requirements is a way to help us. 
If you have the capacity, feel free to fork, modify, and publish your own services, which will facilitate your own work while also helping others.