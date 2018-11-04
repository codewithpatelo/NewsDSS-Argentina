# Asistente Inteligente analizador de noticias BETA

## Descripción
Agente inteligente que analiza el texto de un artículo noticiario Argentino para analizar si es confiable de leer o no y en base a dicho resultado, realizar una recomendación accionable argumentada.

Analisis inspirado en los 5 filtros de Chomsky en su libro 'Consenso Manufacturado' (1995).

El propósito de esta aplicación que darle a los usuarios una herramienta para elaborar juicios informados acerca de la confiabilidad de una noticia.
Tendremos en cuenta una gran diversidad de variables tales cómo, ¿Es una noticia que pertenece a un medio de un grupo concetrado de poder? ¿Quién financia ese medio? ¿Cómo monetiza? ¿En el texto predomina el lenguaje subjetivo u objetivo? ¿Qué tan actual es la noticia? ¿Usan varias fuentas para afirmar lo qué dicen? ¿Las afirmaciones del texto estan argumentadas o no? 

![Interfaz](readme.jpg)

## Autor

* Patricio J. Gerpe


## Tech stack

### Back-End
* NodeJS: v8.11.1
* Express: 4.16.0

#### Dependencies:

##### Web scraping
* "cheerio": "^1.0.0-rc.2"

##### Procesamiento de lenguaje natural 
* "lorca-nlp": "^1.0.12"
* "natural": "^0.6.2"

### DataSets
* FOPEA Mapa de medios - http://mapademediosfopea.com/analisis/
* Corpus de entrenamiento con ejemplos de oraciones subjetivas y objetivas extraidas de noticias reales de Argentina ya labeleadas.
* Corpus de entrenamiento con ejemplos de oraciones que expresan argumentos y oraciones que asumen un hecho sin justificación ya labeleadas.
* Corpus de entrenamiento con ejemplos de afirmaciones que pueden ser chequeables y afirmaciones que no pueden ser chequeables ya labeleadas.
* Corpus de entrenamiento con ejemplos de oraciones con lenguaje asertivo, agresivo y pasivo ya labeleadas.
! ATENCION --> Los corpuses son demasiado pequeños por ahora.

### Front-End
* Material Dashboard - https://github.com/creativetimofficial/material-dashboard
* Bootstrap 4
* Templating language: EJS

#### Avatar 3D + Text to Speech
* Bot Libre - https://www.botlibre.com


## Set-Up

1. `npm i`
2. `npm start`  


## ¿Cómo funciona?


Nuestro agente inteligente tiene como objetivo recomendar que articulos de noticias que son confiables para leer y cuáles no lo son.

Tomaremos como atributos de nuestra decisión ciertos atributos deseables en el texto de la noticia:

1. A1: Objetividad
Entenderemos a este atributo como la cantidad de oraciones objetivas presentes en el texto sobre el total de oraciones del texto.

2. A2: Accesibilidad
Accesibilidad posee los siguientes sub-atributos:
    1. A2a: Indice de lectura. Se usa un indicador built-in de LorcaJS que indica que tan sencillo es el articulo para leer.
    2. A2b: Presencia de oraciones con lenguaje asertivo (clasificador de Bayes) sobre total de oraciones del texto.

3. A3: Verificabilidad
    1. A3a: Chequeabilidad. Se usa chequeabot de Chequeado. (Ahora se esta usando un clasificador de Bayes con el corpus de entrenamiento).
	2. A3b: Cantidad de fuentes. Se usa una regla para detectar si el texto tiene fuentes o no.

4. A4: Confiabilidad
    1. A4a: Presencia de oraciones argumentadas (Clasificador de Bayes) sobre total de oraciones.
    2. A4b: Fecha de publicación del articulo > 2015  (Verificamos si el texto es actual)
    3. A4c: Independencia (Verificamos si el medio es independiente o depende de un grupo economico o del estado.)
	
		
Cada atributo recibe un peso (weight) que representa su importancia. --> Se puede usar el metodo HPA para hacer este proceso.
Por ahora se hizo de manera manual.

1. A1: Objetividad  / Peso: 40%

2. A2: Accesibilidad / Peso: 10%
    1. A2a: Indice de lectura. / Peso: 90%
	2. A2b: Presencia de oraciones con lenguaje asertivo. / Peso: 10%

3. A3: Verificabilidad / Peso: 30%
    1. A3a: Chequeabilidad. / Peso: 80%
	2. A3b: Cantidad de fuentes. / Peso: 20%

4. A4: Confiabilidad / Peso: 20%
    1. A4a: Presencia de oraciones argumentadas / Peso: 5%
	2. A4b: Fecha de publicación. Por ahora no se tiene en cuenta. En futuras versiones si...
	3. A4c: Independencia / Peso: 95%


Entonces... 

El usuario nos envia una URL.

Nosotros hacemos una **request** a esa URL y usamos **Cheerio** para manipular su contenido. 
Extraemos información de sus metatags de opengraph tales como el título, descripción e imagen de thumbnail.
Tenemos una base de datos de FOPEA con un listado de medios y sus respectivos dueños. A partir del nombre de medio lo buscamos en la lista del csv
(primero preprocesandolo con **csvtjson**). Allí encontraremos información de que grupo economico es dueño de dicho medio y en qué porcentaje.
Ahora analizamos el texto con la librería de NLP **LorcaJS**. Tokenizamos el texto en oraciones. Y pasamos cada oración por nuestros clasificadores de Bayes.

Computamos cada uno de nuestros atributos en base de lo observado en el texto.

Se rankea cada atributo en relación a su valor y su peso, y luego se computa un indice de decisión para el texto.

Si un umbral predeterminado es superado, se recomienda leer el archivo. En caso contrario el agente recomienda buscar la noticia desde otras fuentes.

El agente formula en su respuesta sintetizada un orden de prioridad de los 3 argumentos más relevantes para tomar esa decisión en base al ranking realizado de atributos.


## Debugging y linteo:

### Estilo de código:

* AIRBNB
[AIRBNB JS CODE STYLE](https://dev.mysql.com/doc/ "AIRBNB JS CODE STYLE")

### Configuration

* Eslint v-4.19.1 // AIRBNB Configuration

### Correción y linteo:

* Chequear errores: `npm run check`
* Chequear y corregir errores:  `npm run lint` or `npm run check -- --fix`


## Endpoints

Route: **/filter**

```javascript
PostBody = {
	  url: <url>
	};
```

```javascript
response = { 
  url: '',
  imagethum: '',
  titulo: '',
  media: '',
  mediaIndex: 0,
  nombre: '',
  dueno: '',
  financiamiento: '',
  monetizacion: '',
  esGrupoConcentrado: '',
  tema: [],
  temas_relacionados: [],
  fuentes: [],
  porcentaje: '',
  objetividad: 0,
  verificabilidad: 0,
  accesibilidad: 0,
  confiabilidad: 0,
  puntaje: 0,
  texto: '',
  descripcion: '' }
```

## Limitaciones y Aclaraciones

* Los corpus de entrenamiento son demasiado pequeños, lo cuál hace que este proyecto **no este funcional** de ninguna manera. **Este proyecto necesita voluntarios para incrementar, emplolijar y labelear corpus de noticias.**
* Los pesos asignados y sus valores son asignados manualmente, a juicio subjetivo.
* No existe aun un dataset con información financiera de los concentrados economicos de medios.
* No necesariamente un clasificador de Bayes es el método más efectivo para clasificar corpus.
* Hay que solicitar permiso para usar el chequeabot de chequeado.
* Depende de heuristicas y reglas en parte.
* Avatares animados de BotLibre son limitados, en este caso se eligió uno acorde al theme de diseño, aunque podría haber sido uno sin genero especifico.
* Es una versión BETA no libre de bugs.

## Código disponible a la comunidad.

El código se deja abierto a la comunidad para quiénes deseen mejorarlo.
