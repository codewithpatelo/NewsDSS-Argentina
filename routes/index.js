/** ***************************************************************************************************************
******************************************************************************************************************

/*****************************************************************************************************************
******************************************************************************************************************                           

                                                index - index.js
******************************************************************************************************************
******************************************************************************************************************
Este archivo contiene la lógica de nuestro agente de soporte de decisión.


******************************************************************************************************************

Vamos a partir de una URL de una noticia.
	   Usamos el dataset de FOPEA de mapas de medios para indicar:
	   Si el articulo viene de un medio que es parte de un grupo concentrado de medios y cuál.
	   Forma de financiamiento y monetización del medio.

   Luego se procesa el articulo. Se extrae el HTML con cheerio. Se tokeniza el corpus del articulo en oraciones con LorcaJS.
   Cada oración es analizada...

   Para analizar si el texto es confiable para leer vamos a analizar si las oraciones del texto presentan los sgts atributos deseables
   A1 = Objetividad
		  A1a = Ausencia de oraciones subjetivas. (Uso de primera persona, adjetivos calificativos, verbos de opinión)
		      Para esto se usa un clasificador de Bayes con un corpus de oraciones en noticas Argentinas labeleado
		       de oraciones objetivas/subjetivas con LorcaJS.
   A2 = Accesibilidad
		   A2a = Indice de lectura. Se usa un indicador built-in de LorcaJS que indica que tan sencillo es el articulo para leer.
		   A2b = Presencia de lenguaje asertivo.
		   Idem con lenguaje subjetivo.
   A3 = Verificabilidad
		   A3a = Chequeabilidad. Se usa chequeabot de Chequeado.
		   A3b = Cantidad de fuentes. Se usa una heuristica para detectar si el texto tiene fuentes o no.

   A4 = Confiabilidad
		   A4a = Presencia de oraciones argumentadas. Se entrena un clasificador de Bayes con un corpus de oraciones que expresan argumentos contra otras que asumen hechos sin justificación.
		   A4b = Fecha de publicación del articulo > 2015
		   A4c = Independencia (Analiza si el medio pertenece a un grupo concentrado o no)

  Cada atributo recibe un peso (weight) que representa su importancia. --> Se puede usar el metodo HPA para hacer este proceso.
  Por ahora se hizo de manera manual.
  Se rankea cada atributo y se computa un indice de decisión para el texto.

  Si un umbral predeterminado es superado, se recomienda leer el archivo.

  El agente formula en orden de prioridad 3 argumentos más relevantes para tomar esa decisión en base al ranking realizado de
  atributos.


   En caso que el texto no pase el umbral el agente recomienda otros sitios que hablen del mismo tema.
<<<<<<< HEAD

******************************************************************************************************************
**************************************************************************************************************** */
=======
   
******************************************************************************************************************
*****************************************************************************************************************/
>>>>>>> b7b198919df0bb002ddc8d1586ebb0552dbf9b4e

const express = require('express');

const router = express.Router();

// Librerias para extraer HTML de los articulos
const https = require('https');
const cheerio = require('cheerio');

// Libreria para usar timestamps en NodeJS.
const moment = require('moment');


// Herramientas de matematica y algoritmica.
const math = require('mathjs');
const compare = require('hamming-distance');
const hamming = require('compute-hamming');
let distance = require('euclidean-distance');

// Herramientas de NLP
const natural = require('natural');
const lorca = require('lorca-nlp');



/** ***************************************************************************************************************
                                          Entrenamiento de clasificadores
***************************************************************************************************************** */

/*****************************************************************************************************************                          
                                          Entrenamiento de clasificadores
******************************************************************************************************************/


// Objetividad
const objetividad = new natural.BayesClassifier();

// !! ATENCION -- SE NECESITAN MUCHISIMOS MAS CASOS
objetividad.addDocument('Durante el segundo trimestre hubo una reducción del 36,1% en la cantidad de juicios contra las ART y los Empleadores Autoasegurados', 'objetivo');
objetividad.addDocument('Específicamente, las 21.905 causas iniciadas por trabajadores de unidades productivas fueron 36,1% menos que en el mismo período del año anterior.', 'objetivo');
objetividad.addDocument('mientras que las 383 comenzadas por trabajadores de casas particulares fueron 37,7% menos que en el segundo trimestre de 2017.', 'objetivo');
objetividad.addDocument(' Las empresas más grandes fueron las que experimentaron una mayor merma en la cantidad de juicios enfrentados, al bajar un 44,5% en comparación con los del año pasado', 'objetivo');
objetividad.addDocument('El estudio destaca que de las cinco grandes provincias que tienen mayor cantidad de juicios contra el sistema iniciados por trabajadores de unidades productivas la mayor baja se registró en Córdoba (-80%)', 'objetivo');
objetividad.addDocument('En el mismo período, la cantidad de juicios registrados en la provincia de Buenos Aires subió un 23,7%', 'objetivo');
objetividad.addDocument('El lunes, el Gobierno ratificó a través del Boletín Oficial el reajuste de los haberes para los jubilados. ', 'objetivo');
objetividad.addDocument('El 4 de diciembre será el turno de la aplicación del 2x1 en las causa de delitos de lesa humanidad.', 'objetivo');
objetividad.addDocument('AYUDAME A CLASIFICAR ARTICULOS', 'objetivo');
objetividad.addDocument('AYUDAME A CLASIFICAR ARTICULOS', 'objetivo');
objetividad.addDocument('AYUDAME A CLASIFICAR ARTICULOS', 'objetivo');
objetividad.addDocument('AYUDAME A CLASIFICAR ARTICULOS', 'objetivo');
objetividad.addDocument('AYUDAME A CLASIFICAR ARTICULOS', 'objetivo');
objetividad.addDocument('Las mujeres y su difícil relación con los hombres.', 'subjetivo');
objetividad.addDocument('O los hombres y su dificilísima relación con las mujeres. ', 'subjetivo');
objetividad.addDocument('me parece mentira lo mucho que están cambiado las cosas', 'subjetivo');
objetividad.addDocument('¡qué tenacidad y qué potencia tienen esas mujeres cimbreantes!', 'subjetivo');
objetividad.addDocument('Será en los meses más duros de la recesión.', 'subjetivo');
objetividad.addDocument('Estos giros arribarán mientras la economía espera recuperarse de una recesión severa.', 'subjetivo');
objetividad.addDocument('Si en el mundo ha mejorado la situación femenina es porque los hombres también han cambiad', 'subjetivo');
objetividad.addDocument('Si bien el nuevo programa tenía ya el beneplácito público de Lagarde y varios gobiernos de las principales potencias.', 'subjetivo');
objetividad.addDocument('Trabajar la asertividad en la comunicación es una de las habilidades deseables para cualquier trabajador', 'subjetivo');
objetividad.addDocument('La comunicación de tipo asertivo es la forma más adecuada para dirigirnos a un cliente, ya que es la mejor manera de expresar lo que queremos decir sin que el otro interlocutor se sienta agredido', 'subjetivo');
objetividad.addDocument('Pero no se le puede exigir a Boca que se focalice en Gimnasia cuando dentro de cuatro días tiene que afrontar la revancha contra Palmeiras en busca de un lugar en la final de la Copa Libertadores.', 'subjetivo');
objetividad.addDocument('Es difícil estar acá teniendo en cuenta lo que nos estamos jugando a nivel internacional', 'subjetivo');
objetividad.addDocument('En los campeonatos en los que a nosotros nos tocó ganar la Libertadores, los campeonatos no los ganamos nunca', 'subjetivo');
objetividad.addDocument('Chocó con Tijanovich y tiene un golpe en la rodilla pero está bien, va a llegar bien', 'subjetivo');
objetividad.addDocument('GELP se defendió bien, la luchó bien, fue un partido muy parejo', 'subjetivo');
objetividad.addDocument('GELP marcó la diferencia y la supo defender, no metiéndose atrás sino con la lucha, con la pelea', 'subjetivo');
objetividad.addDocument('¿Cardona? Los análisis individuales prefiero hacerlos en privado. No hay que culpar a uno solo por el resultado. Somos un equipo', 'subjetivo');
objetividad.addDocument('No tuvimos ninguna situación clara generada a través del juego. Perdimos por eso y la verdad que está bien"', 'subjetivo');
objetividad.addDocument('Vamos a dejar la vida como el miércoles para pasar a la final', 'subjetivo');
objetividad.addDocument('Lo tomé como una oportunidad para poder cumplir mi sueño de ser un emprendedor global', 'subjetivo');
objetividad.addDocument('En ese momento trabajaba como repositor en un supermercado y creía que no iba a poder salir de ese puesto', 'subjetivo');
objetividad.addDocument('Copa América de Talla Baja: el espectacular gol de chilena con el que Argentina venció a Brasil en semifinales', 'subjetivo');
objetividad.addDocument('se impusieron 2-1 con una espectacular anotación de Martín Antúnez', 'subjetivo');
objetividad.addDocument('No fue todo: el primer gol de Antúnez fue una verdadera obra de arte. ', 'subjetivo');
objetividad.addDocument('AYUDAME A CLASIFICAR', 'subjetivo');
objetividad.addDocument('AYUDAME A CLASIFICAR', 'subjetivo');
objetividad.addDocument('AYUDAME A CLASIFICAR', 'subjetivo');
objetividad.addDocument('AYUDAME A CLASIFICAR', 'subjetivo');
objetividad.addDocument('AYUDAME A CLASIFICAR', 'subjetivo');


objetividad.train();

// ASERTIVIDAD
const asertividad = new natural.BayesClassifier();

// !! ATENCION -- SE NECESITAN MUCHISIMOS MAS CASOS
asertividad.addDocument('Mire, con tranquilidad podremos solucionar esto, no obstante, sabe que esto requiere de un tiempo para poder hacerlo por lo que podemos valorar si le merece la pena continuar ahora o en otro momento. ¿Le parece bien?', 'asertivo');
asertividad.addDocument('Tiene razón al decir que le hemos pedido estos datos en varias ocasiones pero entenderá que tengo que comprobar que todo es correcto.', 'asertivo');
asertividad.addDocument('¿Qué cree que podríamos hacer para que esto no volviera a ocurrir?', 'asertivo');
asertividad.addDocument('AYUDAME A CLASIFICAR', 'asertivo');
asertividad.addDocument('AYUDAME A CLASIFICAR', 'agresivo');
asertividad.addDocument('AYUDAME A CLASIFICAR', 'pasivo');

asertividad.train();

// VERIFICABILIDAD ---> ESTO VA A SER REEMPLAZADO CON CHEQUEABOT
const verificabilidad = new natural.BayesClassifier();

// !! ATENCION -- SE NECESITAN MUCHISIMOS MAS CASOS
verificabilidad.addDocument('El directorio ejecutivo del Fondo aprobó el acuerdo.', 'verificable');
verificabilidad.addDocument('Los desembolsos más grandes llegan en diciembre y marzo.', 'verificable');
verificabilidad.addDocument('El total es de 53.600 millones de dólares.', 'verificable');
verificabilidad.addDocument('El Directorio Ejecutivo del Fondo Monetario Internacional (FMI) aprobó ayer en Washington el renovado acuerdo stand by que otorgará un total de 56.300 millones de dólares para la Argentina.', 'verificable');
verificabilidad.addDocument('El estudio destaca que de las cinco grandes provincias que tienen mayor cantidad de juicios contra el sistema iniciados por trabajadores de unidades productivas la mayor baja se registró en Córdoba (-80%)', 'verificable');
verificabilidad.addDocument('AYUDAME A CLASIFICAR', 'verificable');
verificabilidad.addDocument('AYUDAME A CLASIFICAR', 'verificable');
verificabilidad.addDocument('AYUDAME A CLASIFICAR', 'verificable');
verificabilidad.addDocument('AYUDAME A CLASIFICAR', 'verificable');
verificabilidad.addDocument('Trabajar la asertividad en la comunicación es una de las habilidades deseables para cualquier trabajador', 'noVerificable');
verificabilidad.addDocument('La comunicación de tipo asertivo es la forma más adecuada para dirigirnos a un cliente, ya que es la mejor manera de expresar lo que queremos decir sin que el otro interlocutor se sienta agredido', 'noVerificable');
verificabilidad.addDocument('AYUDAME A CLASIFICAR', 'noVerificable');
verificabilidad.addDocument('AYUDAME A CLASIFICAR', 'noVerificable');
verificabilidad.addDocument('AYUDAME A CLASIFICAR', 'noVerificable');
verificabilidad.addDocument('AYUDAME A CLASIFICAR', 'noVerificable');
verificabilidad.addDocument('AYUDAME A CLASIFICAR', 'noVerificable');


verificabilidad.train();

// ARGUMENTATIVIDAD
const argumentatividad = new natural.BayesClassifier();

argumentatividad.addDocument('De acuerdo al memorándum de políticas económicas y financieras acordado entre la Argentina y el FMI, las claves del stand-by por US$ 56.300 millones y las perspectivas para la economía son las siguiente', 'argumentado');
argumentatividad.addDocument('El Memorándum es claro sobre la aceleración de los desembolsos en el período 2018-2019: el 88% de los US$ 56.300 millones del programa llegarán hasta septiembre', 'argumentado');
argumentatividad.addDocument('Si en el mundo ha mejorado la situación femenina es porque los hombres también han cambiado', 'argumentado');
argumentatividad.addDocument('La comunicación de tipo asertivo es la forma más adecuada para dirigirnos a un cliente, ya que es la mejor manera de expresar lo que queremos decir sin que el otro interlocutor se sienta agredido', 'argumentado');
argumentatividad.addDocument('El técnico xeneize es consciente de lo que le pasa tanto a él como a sus jugadores. "El equipo está con la mente en la Copa Libertadores. Por más que cambien los jugadores se siente en la preparación. No jugamos bien, pero entiendo la coyuntura de este partido', 'argumentado');
argumentatividad.addDocument('No tuvimos ninguna situación clara generada a través del juego. Perdimos por eso y la verdad que está bien"', 'argumentado');
argumentatividad.addDocument('Un estudio reciente elaborado por el Departamento de Estadística de la Superintendencia de Riesgos del Trabajo (SRT) muestra que la tendencia en juicios laborales mantuvo un camino descendente', 'argumentado');
argumentatividad.addDocument('El estudio destaca que de las cinco grandes provincias que tienen mayor cantidad de juicios contra el sistema iniciados por trabajadores de unidades productivas la mayor baja se registró en Córdoba (-80%)', 'argumentado');
argumentatividad.addDocument('Entre las jurisdicciones que marcaron subas, el informe menciona a Santa Fe, que aún no se adhirió a la nueva ley de riesgos del trabajo, donde la litigiosidad subió un 3,6%.', 'argumentado');
argumentatividad.addDocument(' el informe nota que los servicios financieros observaron la mayor caída en litigios, por un 45,8%', 'argumentado');
argumentatividad.addDocument('AYUDAME A CLASIFICAR', 'argumentado');
argumentatividad.addDocument('AYUDAME A CLASIFICAR', 'argumentado');
argumentatividad.addDocument('AYUDAME A CLASIFICAR', 'argumentado');
argumentatividad.addDocument('AYUDAME A CLASIFICAR', 'argumentado');
argumentatividad.addDocument('Las mujeres y su difícil relación con los hombres.', 'desargumentado');
argumentatividad.addDocument('O los hombres y su dificilísima relación con las mujeres.', 'desargumentado');
argumentatividad.addDocument('Trabajar la asertividad en la comunicación es una de las habilidades deseables para cualquier trabajadorTrabajar la asertividad en la comunicación es una de las habilidades deseables para cualquier trabajador', 'desargumentado');
argumentatividad.addDocument('AYUDAME A CLASIFICAR', 'desargumentado');
argumentatividad.addDocument('AYUDAME A CLASIFICAR', 'desargumentado');
argumentatividad.addDocument('AYUDAME A CLASIFICAR', 'desargumentado');
argumentatividad.addDocument('AYUDAME A CLASIFICAR', 'desargumentado');
argumentatividad.addDocument('AYUDAME A CLASIFICAR', 'desargumentado');


argumentatividad.train();


// ACA VAMOS A PREPROCESAR LA DATA DEL DATASET DE FOPEA...
const fs = require('fs');

const pags = [];
const relaciones = [];

let csvFilePath = './db/medios.csv';
const csv = require('csvtojson');

csv()
  .fromFile(csvFilePath)
  .then((jsonObj) => {
    for (let i = 0; i != jsonObj.length; i++) {
	  if (jsonObj[i].SITIOWEB != '' && jsonObj[i].SITIOWEB != null) {
	  pags.push(jsonObj[i]);
	  }
    }
  });

csvFilePath = './db/relaciones.csv';
csv()
  .fromFile(csvFilePath)
  .then((jsonObj) => {
    for (let i = 0; i != jsonObj.length; i++) {
	  if (jsonObj[i].NOMBRE != '' && jsonObj[i].NOMBRE != null) {
	  relaciones.push(jsonObj[i]);
	  }
    }
  });


// SimbiaticJS  !! BETA !!
// Por ahora usamos un paradigma basado en objetos, pero luego usaremos metodos proveenientes de un agente.
// Creamos el prototipo de agente que usaremos en versiones posteriores de esta aplicación.
const agent = function (name) {
  this.name = name;
};

agent.prototype.decide = function (criterias, ulTher) {
  let altScore = 0;
  for (let i = 0; i != criterias.length; i++) {
    altScore += criterias[i].value * criterias[i].weight;
  }

  distance = altScore / ulTher;
  if (distance > 0) {
    this.message = 'Observo que.' + 'eso quiere decir' + 'Yo recomiendo' + 'hacer ' + 'ya que';
  }
};


// RUTAS
/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Filtrado de Noticias segun los 5 filtros de Chomsky' });
});


// Este es el endpoint para filtrar una noticia.

router.post('/filter', (req, res, next) => {
  const url = req.body.url;


  // Seteamos el objeto de nuestra respuesta.
  const response = {
    url,
    imagethum: '',
    titulo: '',
    media: '',
    mediaIndex: 0,
    nombre: '',
    dueno: '',
    financiamiento: 'No encontrado',
    monetizacion: 'No encontrado',
    esGrupoConcentrado: 'Sí',
    tema: '',
    temas_relacionados: [],
    fuentes: [],
    porcentaje: 0,
    objetividad: 0,
    verificabilidad: 0,
    accesibilidad: 0,
    confiabilidad: 0,
    puntaje: 0,
    texto: '',

  };

  // Agregamos a nuestra respuesta la data que tenemos del dataset de FOPEA.
  for (var i = 0; i != pags.length; i++) {
    const pag = pags[i].SITIOWEB;

    if (url.includes(pag)) {
	     response.media = pag;
		 response.mediaIndex = i;
		 response.nombre = pags[i].NOMBRE;
    }
  }

  for (var i = 0; i != relaciones.length; i++) {
    if (response.nombre === relaciones[i].NOMBRE) {
	     response.dueno = relaciones[i].ENTIDAD;
		 response.porcentaje = relaciones[i].PORCENTAJE;
		 // response.financiamiento = relaciones[i].FINANCIAMIENTO;
		 // response.monetizacion = relaciones[i].MONETIZACION;
		 // response.esGrupoConcentrado = relaciones[i].GRUPOCONCENTRADO;
    }
  }


  // AHORA VAMOS A MANIPULAR EL HTML DEL ARTICULO PARA OBTENER EL TEXTO QUE HAY EN EL
  https.get(url, (resp) => {
    resp.setEncoding('utf8');
    let body = '';
    resp.on('data', (data) => {
      body += data;
    });
    resp.on('end', () => {
	  // USAMOS CHEERIO PARA OBTENER EL TEXTO SIN TAGS DE HTML
      const $ = cheerio.load(String(body));

      // body = striptags(body, [], ' ');
      body = $('body').text();

      // SACAMOS LA INFORMACION QUE PODEMOS DE LOS METATAGS DE OPENGRAPH
      response.imagethum = $('meta[property="og:image"]').attr('content');
      response.titulo = $('meta[property="og:title"]').attr('content');
      response.descripcion = $('meta[property="og:description"]').attr('content');

      // USAMOS LORCA PARA ANALIZAR EL TEXTO LINGUISTICAMENTE
      const doc = lorca(body);


      // Para detectar el posible tema del texto , agarramos todo el texto y le sacamos las stopwords...
      let nText = String(body).toLowerCase();
      const stopWords = [response.nombre, ' al ', ' no ', ' si ', ' su ', 'qué', 'más', ' uno ', ' como ', ' con ', 'La ', 'El ', 'Lo ', ' son ', 'Los ', 'No ', ' las ', ' sus ', 'Su ', ' con ', 'Te ', 'Para ', ' yo ', ' el ', ' se ', ' por ', ' vos ', ' un ', ' de ', ' tu ', ' para ', ' el ', ' lo ', ' los ', ' ella ', ' de ', ' es ', ' una ', ' fue ', ' tiene ', ' la ', ' y ', ' del ', ' los ', ' que ', ' a ', ' en ', ' el '];


      for (i = 0; i < stopWords.length; i++) {
        nText = nText.replace(new RegExp(stopWords[i], 'g'), ' ');
      }

      // Usamos lorca para manipular la linguistica del texto
      nText = lorca(String(nText));

      // El metodo concordance nos dice cual es las palabras más repetidas... sacamos las dos primeras que se repitan que no sean stopwords.
      nText = nText.concordance().sort(2).get();

      response.tema = Object.keys(nText).map(key => [String(key), nText[key]]);

      fixArray = [];

      fixArray.push(response.tema[0][0]);
      fixArray.push(response.tema[1][0]);

      response.tema = fixArray;


      // AHORA vamos a computar los atributos de nuestra decisión en base a lo que encontremos en el texto...
      let objectivity = 0;
      let argumentativity = 0;
      let verificability = 0;
      const accesibility = 0;
      let assertiveness = 0;
      let powerConcentration = 0;



      // Pasa por cada oración y la hace clasificador por el clasificador de Bayes que entrenamos con LorcaJS.

      for (var i = 0; i != doc.sentences().get().length; i++) {
           if (verificabilidad.classify(doc.sentences().get()[i]) === 'verificable') {
	     verificability += 1;
        }
           if (objetividad.classify(doc.sentences().get()[i]) === 'objetivo') {
	      objectivity += 1;
        }
	   if (argumentatividad.classify(doc.sentences().get()[i]) === 'argumentado') {
              argumentativity += 1;
        }

           if (asertividad.classify(doc.sentences().get()[i]) === 'asertivo') {
              assertiveness += 1;
        }

        // USAMOS ESTA HEURISTICA PARA VER SI EL TEXTO CONTIENE FUENTES.
        if (String(doc.sentences().get()[i]).includes('Fuente') === true) {
          console.log(String(doc.sentences().get()[i]));
          response.fuentes.push(String(doc.sentences().get()[i]));
        }
      }


     // Computamos objetividad...
     // Cantidad de oraciones objetivas / Total de oraciones del texto , en un indice del 1 al 10.
     response.objetividad = Math.round(objectivity / doc.sentences().get().length) * 10;

      // Computamos accesibilidad...
      // Facilidad de lectura (LorcaJS) en un indice del 1 al 10
      const readability = Math.round((doc.ifsz().get() / 100)) * 10;

      // Computamos asertvidad... (Cantidad de oraciones con lenguaje asertivo / total oraciones en un indice de 1 a 10)
      asertiveness = (Math.round(assertiveness / doc.sentences().get().length * 100) / 100) * 10;

      // Se multiplica cada subatributo por un peso y se divide por dos.
      response.accesibilidad = Math.round((readability * 0.9 + asertiveness * 0.1) / 2);


      // Computamos verificabilidad
      verificability = (Math.round(verificability / doc.sentences().get().length * 100) / 100) * 10;
      // (Cantidad de fuentes. (Máx 5) / 5) en un index 1/10
      let sources = 0;
      if (response.fuentes.length > 5) {
        sources = 10;
      } else {
<<<<<<< HEAD
	  sources = (response.fuentes.length / 5) * 10;
=======
          sources = (response.fuentes.length / 5) * 10;
>>>>>>> b7b198919df0bb002ddc8d1586ebb0552dbf9b4e
      }
      response.verificabilidad = Math.round((verificability * 0.8 + sources * 0.2) / 2);


      // Computamos confiabilidad...

      // Presencia de oraciones argumentadas / Total oraciones en un indice de 10
      argumentativity = (Math.round(argumentativity / doc.sentences().get().length * 100) / 100) * 10;

	  // Aca no tenemos forma por ahora de sacar la fecha de publicación pero lo solucionaremos en versiones posteriores.

	  if (response.esGrupoConcentrado !== 'Sí') {
		  powerConcentration = 0;
	  } else {
		  powerConcentration = 10;
	  }

	  response.confiabilidad = Math.round((argumentativity * 0.95 + powerConcentration * 0.05) / 2);


	  // Ahora que computamos nuestros atributos con sus subtributos vamos a crear una matriz de decisión representada en
	  // este JSON Array.

      const criterias = [
        {
          name: 'Objetividad',
          argument: 'en general, el texto contiene información y datos objetivos',
          score: response.objetividad,
          weight: 0.40,
          rating: null,
          rank: 0,
        }, {
          name: 'Accesibilidad',
          argument: 'usa una terminologia sencilla, lo que sugiere que se haga facíl de leer',
          score: response.accesibilidad,
          weight: 0.10,
          rating: null,
          rank: 0,
        }, {
          name: 'Verificabilidad',
          argument: 'el contenido generalmente es chequeable',
          score: response.verificabilidad,
          weight: 0.30,
          rating: null,
          rank: 0,
        }, {
          name: 'Confibilidad',
          argument: 'observé que el autor suele articular sus ideas con argumentos',
          score: response.accesibilidad,
          weight: 0.20,
          rating: null,
          rank: 0,
        },

	    ];

      // Calculamos el vector del puntaje con el pesado correspondiente...
      criterias[0].rating = criterias[0].score * criterias[0].weight;
      criterias[1].rating = criterias[1].score * criterias[1].weight;
      criterias[2].rating = criterias[2].score * criterias[2].weight;
      criterias[3].rating = criterias[3].score * criterias[3].weight;

      // Tomamos el puntaje obtenido.
      const actualScore = [criterias[0].rating, criterias[1].rating, criterias[2].rating, criterias[3].rating];

      // Definimos el mejor escenario posible...
      const idealScore = [10 * 0.4, 10 * 0.1, 10 * 0.3, 10 * 0.2];

      // Definimos el peor escenario posible...
      const worstScore = [0, 0, 0, 0];

      // ALGORITMO DE TOPSIS

      // Calculamos la distancia ecluidea del puntaje obtenido y el mejor escenario.
      const distP = distance(actualScore, idealScore);

      // Calculamos la distancia ecluidea del puntaje obtenido y el mejor escenario.
      const distN = distance(actualScore, worstScore);

      // Calculando similitud al peor escenario...
      const sim = distN / (distN + distP);

      console.log(sim);

      // Calculamos puntaje final.
      const score = criterias[0].rating + criterias[1].rating + criterias[2].rating + criterias[3].rating;

      response.puntaje = Math.round(sim * 100) / 100;


      // Creamos un fuzzy set para definir nuestro umbral de decisión
      const fuzzySet = {
        linguisticLabels: ['low', 'medium', 'high'],
	    fuzzyNumbers: [[0, 0.16, 0.33], [0.33, 0.49, 0.66], [0.66, 0.83, 1]],
      };

      // Verificamos a qué label nuestro valor es más perteneciente.
      const membershipFunction = function (n, fn) {
	     const distL = Math.round(Math.abs(n - math.median(fn.fuzzyNumbers[0])) * 100) / 100;
	     const distM = Math.round(Math.abs(n - math.median(fn.fuzzyNumbers[1])) * 100) / 100;
	     const distH = Math.round(Math.abs(n - math.median(fn.fuzzyNumbers[2])) * 100) / 100;

		 const memberValue = Math.min(distL, distM, distH);
		 let memberLabel = '';

		 switch (memberValue) {
          case distL:
            memberLabel = fn.linguisticLabels[0];
            break;
          case distM:
            memberLabel = fn.linguisticLabels[1];
            break;
		   case distH:
		     memberLabel = fn.linguisticLabels[2];
		   break;
          default:
            memberLabel = fn.linguisticLabels[0];
        }

	     return memberLabel;
      };

	 const resultLabel = membershipFunction(response.puntaje, fuzzySet);


	  
      // Creamos un fuzzy set para definir nuestro umbral de decisión
      let fuzzySet = {
        linguisticLabels: ['low', 'medium', 'high'],
	    fuzzyNumbers: [[0,0.16,0.33], [0.33,0.49,0.66], [0.66,0.83,1]]
      };

     // Verificamos a qué label nuestro valor es más perteneciente.
     let membershipFunction = function(n, fn) {
	     let distL = Math.round(Math.abs(n - math.median(fn.fuzzyNumbers[0])) * 100) / 100;;
	     let distM = Math.round(Math.abs(n - math.median(fn.fuzzyNumbers[1])) * 100) / 100;;
	     let distH = Math.round(Math.abs(n - math.median(fn.fuzzyNumbers[2])) * 100) / 100;;
		 
		 let memberValue = Math.min(distL,distM,distH);
		 let memberLabel = '';
		 
		 switch(memberValue) {
           case distL:
             memberLabel = fn.linguisticLabels[0];
           break;
           case distM:
             memberLabel = fn.linguisticLabels[1];
           break;
		   case distH:
		     memberLabel = fn.linguisticLabels[2];
		   break;
           default:
             memberLabel = fn.linguisticLabels[0];
         }
		 
	     return memberLabel;
     };
	 
	 let resultLabel = membershipFunction(response.puntaje, fuzzySet);
      
      


      // Chequeamos si no pasamos el criterio para negativizar argumentos...
	  if (resultLabel === 'low' || resultLabel === 'medium') {
	    criterias[0].argument = 'en general, el texto abusa de la opinión y el lenguaje subjetivo';
	    criterias[1].argument = 'usa una terminologia complejos son solo pueden ser entendidos por expertos';
	    criterias[2].argument = 'el contenido de este texto es dificil de chequear';
	    criterias[3].argument = 'observé que el autor suele asumir hechos y expresar su posición sin justificarse';
	  }

      // Computamos tiempo de lectura que usaremos en la rta del agente..
      const tiempoLectura = Math.round(doc.readingTime());

      // Si pasa umbral..
      if (resultLabel === 'high') {
        // Vamos a rankear cada argumento de mayor a menor...
        criterias.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        response.texto = `Analicé el articulo de ${response.nombre} sobre ${response.tema[0]} y ${response.tema[1]}. Te recomiendo leerlo ya que ` + `(A) ${criterias[0].argument} , (B) ${criterias[1].argument} y (C) ${criterias[2].argument}. Espero que te interese, te va a llevar unos ${tiempoLectura} minutos leerlo. Gracias por confiar en mi. `;
	 } else {
        // Sino...
	 // Vamos a rankear cada argumento de menor a mayor...
	 criterias.sort((a, b) => parseFloat(a.rating) - parseFloat(b.rating));
	 response.texto = `Analicé el articulo de ${response.nombre} sobre ${response.tema[0]} y ${response.tema[1]}. No te recomiendo leerlo ya que ` + `(A) ${criterias[0].argument} , (B) ${criterias[1].argument} y (C) ${criterias[2].argument}. En su lugar podés buscar en google por otras fuentes acerca del mismo tiempo. Gracias por confiar en mi.`;
	 }

      console.log(response);


      res.render('result', {
        title: 'Resultado del filtro',
        result: response,
      });
    });
  }); // END request request
}); // END ROUTE


module.exports = router;
