const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");	
const WebSocket = require('ws');

const uri = "mongodb://localhost:27017";

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

	  async function rundash() {
		//creazione del client -> deve essere fatta all'interno della funzione che contiene l'inserimento altrimenti 
		//dopo il secondo inserimento perderemo il riferimento al client (per via della close fatta nel finally che è
		// a sua volta necessaria per essere sicuri di aver chiuso la connesione)
		  const client = new MongoClient(uri, useUnifiedTopology = true); 
			  try {
				await client.connect();
			
				const database = client.db("TemperatureDB");
				const temp = database.collection("temperature");
				let query = {timestamp : {$gt:0}}; //prendo i dati con un valore di timestamp grater than 0
				let option = {
					sort: {timestamp: -1},
				}; //-1 : ordine decrescente - 1 : ordine crescente
				let lastTemp = await temp.findOne(query, option);
				try{
				return lastTemp.temperature;
			  } 
			 catch (e) {
				 return -1;
			 } 
			 } finally {
				await client.close(); //La finally nel circuito try catch serve ad eseguire qualcosa IN OGNI CASO dopo aver eseguito il try e/o il catch
			  }
			}
		

//Fondamentale per mettere d'accordo client e server sulla codifica usata
app.use(
    express.urlencoded({
      extended: true
    })
  )

//Definiamo la formattazione su json
app.use(express.json());

//Mettiamo in ascolto il server
app.listen(3000, () => {
 console.log("Server running on port 3000");
});

//Il metodo post è una REST API che permette al client di 'postare' sul server
//In questo caso quando il servere riceve '/temperature' risponderà con ok.
app.post("/temperature", (req, res) => {
    run(req.body).catch(console.dir); //per avviare la funzione asincrona
    res.sendStatus(200);
   });

//Il metodo get è una REST API che permette al client di 'ottenere' dal server
//In questo caso quando il servere riceve '/dashboard' risponderà con l'ultima temperatura letta dal db tramite la funzion rundash().
app.get('/dashboard', async (req, res) => {
	/*
	È fondamentale l' 'await' prima di richiamare la funzione perché mongoclient ci restituisce una promessa. 
	Un promessaa è un'impegno a "consegnare un dato" (e assegnarlo a 
	lastTemperature in questo caso). Poiché noi il dato lo assegniamo e lo usiamo subito
	di fatto andremo a restituire una promessa, non il dato. 
	Con await si aspetta che il dato venga consegnato.
	Utilizzando await siamo constretti a definire l'intera funzione rundash asincrona altrimenti il compilatore si lamenta
	(non riesce a vedere a priori il comportamento di mongoclient quindi non riesce a capire perché dovremmo aspettare
	il return di una chiamato non asincrona (bloccante)) - Senza l'async prima di rundash, la chiamata sarebbe sincrona ma 
	la richiesta a mongoclient no, quindi quello ci restituirebbe una promessa, la funzione sarebbe eseguita e ritornerebbe
	la promessa.
	Inoltre, poiché l'await è usato all'interno di una funzione (implicita in questo caso), anche la funzione
	deve essere resa asincrona.
	È da sottolineare il fatto che, in generale, tutte le funzioni che includono scrittura e lettura dal database devono
	essere asincrone per non bloccare l'applicazione.
	IN PRATICA CON AWAIT DEVE ESSERE ASINCRONA SIA LA FUNZIONE CHE SI ASPETTA (OVVIAMENTE) CHE LA FUNZIONE DENTRO LA QUALE SI
	USA L'AWAIT.
	*/
	let lastTemperature = await rundash().catch(console.dir); 
	res.send("L'ultima temperature è: "+lastTemperature);
	//Oppure se rundash restituire direttamente tutto il JSON:
	//res.send("L'ultima temperature è: "+JSON.stringify(lastTemperature));
})

