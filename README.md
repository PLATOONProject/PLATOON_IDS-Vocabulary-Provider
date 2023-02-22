# PLATOON IDS Vocabulary Provider

This is an implementation of an International Data Spaces (IDS) Vocabulary Provider that manages all the vocabularies (ontologies, reference data models, metadata elements), which can annotate and describe datasets and data analytics tools. This includes the IDS information model and domain-specific vocabularies. 
The Open-source Vocabulary Provider has been funded by the PLATOON H2020 project funded by the EU commission.

## 1. Purpose

The IDS Vocabulary Provider plays an essential role within the PLATOON reference architecture defined in D2.1. It is the link between the Data Governance, Security, Privacy and Sovereignty layer (based on IDS reference architecture) and the Interoperability layer formed. The vocabulary provider provides direct Machine to Machine communication allowing to query and exchange metadata according to the PLATOON Data Models defined in D2.3 through the IDS connectors. In addition, the Vocabulary Provider has a Graphical User Interface (GUI), where users can manage vocabularies (upload/upgrade/delete), search for specific terms, visualize the vocabularies in a network graph and execute SPARQL queries. 

The IDS Vocabulary Provider enhances the capabilities of the PLATOON Marketplace regarding interoperability. It allows the data/data analytics tools users/consumers to easily understand the data and data analytics tools published in the Marketplace, which facilitates the implementation and integration of these datasets and data analytics tools.


## 2. Repository Structure

There are three dockerfiles, one for each of the main three components:
- **Vocol**: creates the image for the vocol manager, downloads all the needed requirements and executes the application.
- **Fuseki**: creates the image for the Fuseki server and launches the server.
- **IDS Vocabulary provider**: creates the image for the core component and launches the corresponding server, a Java environment running the Maven package of the code. 
   
## 3. Software Prerequisites


- **OS**: We recommend using a Linux based operating system. However, any operating system with a Docker installation can be used (tested on Ubuntu 20.04 and Windows 10). More strict hardware requirements than listed above might apply if a non-Linux operating system is used.
- **Docker**: version 20.10.7 or later
- **Docker Compose**: version 1.29.1 or later
- **OpenSSL**: Version 1.1.1k or later. A valid X.509 certificate, signed by a trusted certification authority, is strongly recommended to avoid warnings about insecure HTTPS connections. Docker must be installed on the target machine.
- **Java**: Java 11 or later should be installed in your local environment to build the docker image.
- **Maven**: Maven 3.6.3 or later should be installed in your local environment to build the docker image (execute `mvn -version` to check the successful installation).

## 4  Installation Guide
This part aims to aid IT administrators or developers in the installation of the IDS Vocabulary Provider. 

### 4.1 Prepare The SSL Certificate
A valid X.509 certificate, signed by a trusted certification authority, is strongly recommended to avoid warnings about insecure HTTPS connections. The certificate needs to be of .crt format and must have the name server.crt. In case your certificate is of .pem format, it can be converted with the following commands, which require OpenSSL to be installed:
OpenSSL x509 -in mycert.pem -out server.crt
OpenSSL RSA -in mycert.pem -out server.key
mkdir cert
mv server.crt cert/
mv server.key cert/

The certificate needs to be of *.crt* format and must have the name *server.crt* and the file for private key should have the name *server.key*. In case your certificate is of *.pem* format, it can be converted with the following commands, which require OpenSSL to be installed:

			openssl x509 -in mycert.pem -out server.crt
			openssl rsa -in mykey.pem -out server.key
			mkdir cert
			mv server.crt cert/
			mv server.key cert/

### 4.2 Configuring the Docker-compose File
The docker-compose file is responsible of launching the three containers needed for the Vocabulary Provider to run properly and enable the communication of the three components as they are built in the same network.
Each of the components is exposed in one specific port. Then, if a certain port is occupied by another component of the ecosystem, it is possible to change this port through this file.
The changes of the port can be done in the Vocol component and in the IDS Vocabulary provider if needed, as these components are independent. To do that, edit the docker-compose file and change the corresponding port:
vocol-service:
    container_name: vocol_service_container
    build:
      context: .
      dockerfile: ./dockerfile-vocol
      network: host
    expose:
      - 3000
    ports:
      - "3000:3000"


Another crucial part of adapting the configuration is to provide the correct location of the X.509 certificate in the ids messages service. Assuming the location of the certificate is "/home/vocolProject/cert," the corresponding configuration would be:
volumes:
- /home/vocolProject/cert:/etc/cert/
[…]


### 4.3 Running the Application

To start up the IDS Vocabulary Provider, run the following command inside the directory of the docker-compose.yml file:
docker-compose up -d

This process can take several minutes to complete. You can test whether the IDS Vocabulary Provider has successfully started by opening the following urls:
-	 http://localhost:3000. This is the main page of the vocol service. The UI of the vocol will appear listing the existing ontologies.
-	http://localhost:3030: If the fuseki server is running properly, you could see the main page for the fuseki manager. This page will only be used for manteinance purposes. The dot in the right (server status) side must be green.
-	https://localhost:8082: If the IDS Messaging service is running this url will show an error message but it will be loaded. To call the IDS Query Message a POST call to https://localhost:8082/api/ids/data must be done with the adequate header and payload.

To enter to a running container you could use:
Docker exec -it ids_messages_container /bin/bash : to get a bash shell in the container
Exit to get out

To see the logs of the container:
Go to the directory containing the docker files and:
Docker-compose logs

To interact with a container:
Docker attach vocol_service_container : 

The latter could be useful, for example when uploading new ontologies if it is needed to enter some user or password.


### 4.4 Updating the Containers

Containers can be either hot updated or restarted to apply the changes. To hot update a container, run the following command:
docker-compose up -d—no-deps—build <container name>

Alternatively, one can restart the entire service by running:
docker-compose down : To stop all the containers
docker-compose up –d
If you want to get all the images create again, the you could use:
	Docker-compose build : To build again the images
docker-compose up –d
 

## 5 Built With

* [Vocol](https://github.com/vocol/vocol) - Vocabulary management
* [IDS Framework](https://github.com/International-Data-Spaces-Association/IDS-Connector-Framework) - IDS messages
* [Spring Boot](https://projects.spring.io/spring-boot/) - Application Framework
* [Apache Jena](https://jena.apache.org/documentation/) - Parsing and serializing RDF and Fuseki as triple store for meta data


## 6 License

Licensed under the Apache 2.0. See LICENSE.txt for more details. For respective licenses of individual components and libraries please refer to section 5.
