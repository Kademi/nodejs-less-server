# nodejs-less-server
NodeJs webapp to provide a LESS compiler as a service.
By default it runs on 3000 port and accepts compilation requests on / by POST.

## Usage

POST request parameters:

- `less` - LESS source to compile
- `url` - base URL for @import includes (optional)

Example querying service from command-line:

```bash
curl -v --form "less=@sample.less"  --form "url=http://example.com/some/path/" http://localhost:3000
```

In case of error, service returns HTTP error 400 with error description in the body:

```
Column=1
Line=6
Filename=__input__.less
Type=ParseError
Message=Unrecognised input
5 @var: 123
6 .test {
  ^
```

## Server settings

To run on 80 port instead of default 3000 use PORT environment variable:

```bash
PORT=80 node server.js
```

## Installation

Below is the complete installation guide for Ubuntu Linux

### Installing Node.js

Update the apt-get package lists and install Node.js build dependencies:
```bash
sudo apt-get update
sudo apt-get install -y build-essential openssl libssl-dev pkg-config
```

Download the latest node.js source package from http://nodejs.org/download/ and decompress it:
```bash
cd ~
wget http://nodejs.org/dist/v0.12.0/node-v0.12.0.tar.gz
tar xzf node-v0.12.0.tar.gz
cd node-v0.12.0
```

Then build and install it:

```bash
./configure
make
sudo make install
```

### Running node server on port number below 1024 without root

This step is optional. In order to be able to run the application on 80 port run the following commands:
```bash
sudo apt-get install libcap2-bin
sudo setcap cap_net_bind_service=+ep /usr/local/bin/node
```

### Installing PM2

PM2 is a production process manager for Node.js applications. Install it using NPM:
```bash
sudo npm install pm2 -g
```

### Creating unpriviledged user to run the server

We're going to create user called `node`:
```bash
sudo useradd -s /bin/bash -m -d /home/node -c "nodejs user” node
sudo passwd node
sudo usermod -aG sudo
```

### Installing application

Login as `node` user:
```bash
sudo -iu node
```

Then clone this repo and install dependencies of the application:
```bash
cd ~
git clone https://github.com/Kademi/nodejs-less-server.git
cd nodejs-less-server
npm install
```

Now the application is installed and can be run within a current terminal session using `node server.js` command (this should only be used for debugging purposes).

To install the application as a daemon using previously installed PM2 package, type in the following (this will also start the app):

```bash
PORT=80 pm2 start server.js -n nodejs-less-server
```

Then create a system startup script for PM2, so it will start when the system boots:
```bash
sudo env PATH=$PATH:/usr/local/bin pm2 startup -u node
```

### Notes on PM2

PM2 will automatically restart the application if it crashes.

To see status of running applications within it, type `pm2 list`. Once the aplication added to PM2 via `pm2 start` it could be stopped by `pm2 stop <id>` or restarted by `pm2 restart <id>` where `<id>` is a numeric id of the application or its name (in our case the name is `nodejs-less-server`).

PM2 also takes care about logs. They are collected to `~/.pm2/logs/` directory by default. To display real-time logs of the application, type `pm2 logs nodejs-less-server`. Use `pm2 flush` to empty all log files.
