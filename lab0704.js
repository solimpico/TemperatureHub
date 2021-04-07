const sensorLib = require('node-dht-sensor');
const http = require('http');
//commento
// Setup sensor, exit if failed
const sensorType = 11; // 11 for DHT11, 22 for DHT22 and AM2302
const sensorPin  = 4;  // The GPIO pin number for sensor signal
if (!sensorLib.initialize(sensorType, sensorPin)) {
    console.warn('Failed to initialize sensor');
    process.exit(1);
}

// Automatically update sensor value every 2 seconds
setInterval(function() {
    let readout = sensorLib.read();
    console.log('Temperature:', readout.temperature.toFixed(1) + 'C');
    console.log('Humidity:   ', readout.humidity.toFixed(1)    + '%');

    let temperature = readout.temperature.toFixed(1);
    const data = JSON.stringify({
        "sensor":"ID1", 
        "timestamp": 123456789,
        "temperature":temperature      
      });
      
      const options = {
        hostname: '192.168.1.52',
        port: 3000,
        path: '/temperature',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      }
      
      //effettuiamo la richiesta al server
      const req = http.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`)
      
        res.on('data', d => {  //quando ricevo un dato ('data') fai qualcosa (stampalo in questo caso)
          process.stdout.write(d)
        });
        req.on('error', error => {  //Se la richiesta va in errore ('error') fai qualcosa (stampa l'errore in questo caso)
            console.error(error)
          });
      });
      
      req.write(data)
      req.end()

}, 2000);



