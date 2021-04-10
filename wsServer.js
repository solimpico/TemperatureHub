const WebSocket = require('ws');
const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const path = require('path');	

const uri = "mongodb://localhost:27017";

//CONNESSIONE AL WESOCKET
const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
/*
Qunaod il server riceverà qualcosa invierà in automatico la scritta 'something'.
Affinché sia possibile che il client (broswer) invii qualcosa al server
iniettiamo all'interno del codice html un pezzo di codice javascript capace di
inviare qualcosa al server
*/
  ws.send('In attesa del sensore...\nSe la scritta persiste riprovare più tardi :(');
});

//FUNZIONE DI ACCESSO IN SCRITTURA AL DATABASE
//data è il documento da aggiungere alla collezione del database
async function run(data) {
  //creazione del client -> deve essere fatta all'interno della funzione che contiene l'inserimento altrimenti 
  //dopo il secondo inserimento perderemo il riferimento al client (per via della close fatta nel finally che è
  // a sua volta necessaria per essere sicuri di aver chiuso la connesione)
    const client = new MongoClient(uri, useUnifiedTopology = true); 
  	  try {
  	    await client.connect();
  	
  	    const database = client.db("TemperatureDB");
  	    const temp = database.collection("temperature");
  	    // create a document to be inserted
  	    const doc = data;
  	    const result = await temp.insertOne(doc);
  	
  	    console.log(
  	      `${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`,
  	    );
  	  } finally {
  	    await client.close(); //La finally nel circuito try catch serve ad eseguire qualcosa IN OGNI CASO dopo aver eseguito il try e/o il catch
  	  }
  	}	

//FUNZIONE DI INVIO DATI ALLA DASWBOARD TRAMITE WEBSOCKET
async function pushToClient(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState == WebSocket.OPEN){
            client.send(data);
        }
    });
}

//DEFINIZIONE CODIFICA PER CLIENT E SERVER
app.use(
    express.urlencoded({
      extended: true
    })
  )

//DEFINIZIONE FORMATTAZIONE
app.use(express.json());

//SERVER IN ASCOLTO
app.listen(3000, () => {
 console.log("Server running on port 3000");
});

/*
Il metodo post è una REST API che permette al client di 'postare' sul server
In questo caso quando il servere riceve '/temperature' risponderà con ok
E CARICHERA' SUL DATABASE 
*/
app.post("/temperature", (req, res) => {
    run(req.body).catch(console.dir); //per avviare la funzione asincrona
    pushToClient(JSON.stringify(req.body)).catch(console.dir); 
    res.sendStatus(200);
   });

//Il metodo get è una REST API che permette al client di 'ottenere' dal server
//In questo caso quando il servere non riceve nulla risponderà con una pagina html (index.html).
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/index.html'));
});

/*
La pagina html contiene al suo interno un pezzo di codice javascript capace di inviare un messaggio al server stesso
*/

