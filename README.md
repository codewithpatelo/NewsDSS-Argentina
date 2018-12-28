<img src="./iaarblack.png" width="128" > HUB
# Asistente Inteligente analizador de noticias BETA

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/917d07fdcd1d4804b3b846995902f3dc)](https://app.codacy.com/app/patelotech/NewsDSS-Argentina?utm_source=github.com&utm_medium=referral&utm_content=patelotech/NewsDSS-Argentina&utm_campaign=Badge_Grade_Dashboard)
[![build](https://travis-ci.org/patelotech/NewsDSS-Argentina.svg?branch=master)](https://travis-ci.org/patelotech/NewsDSS-Argentina)
[![dependencies Status](https://david-dm.org/patelotech/NewsDSS-Argentina/status.svg)](https://david-dm.org/patelotech/NewsDSS-Argentina)
[![Known Vulnerabilities](https://snyk.io/test/github/patelotech/topsis/badge.svg?targetFile=package.json)](https://snyk.io/test/github/patelotech/topsis?targetFile=package.json)

## Descripción
Agente inteligente que analiza el texto de un artículo noticiario Argentino para analizar si es confiable de leer o no y en base a dicho resultado, realizar una recomendación accionable argumentada.

Analisis inspirado en los 5 filtros de Chomsky en su libro 'Consenso Fabricado'.

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

##### Matematica
* "euclidean-distance": "^1.0.0",
* "compute-hamming": "^1.1.0",
* "mathjs": "^5.2.3"


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
	2. A3b: Cantidad de fuentes. Se usa una heuristica para detectar si el texto tiene fuentes o no.

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

**Algoritmo** TOPSIS:

1. Se calcula la distancia ecluidea entre el puntaje obtenido y el peor puntaje posible.
![](https://wikimedia.org/api/rest_v1/media/math/render/svg/da482a8c2f0902dad096aab66a0459fecc20a23d)
 
2. Se calcula la distancia ecluidea entr el puntaje obtenido y el mejor puntaje posible.
![](https://wikimedia.org/api/rest_v1/media/math/render/svg/693633e4b0170769f93ed89c9714256698368b7a)

3. Se calcula el indice de performance.
![](https://wikimedia.org/api/rest_v1/media/math/render/svg/cd78e6f8cdbeea32bd6c3955533c09287a69dd41)

Si el indice de performance supera un umbral predeterminado, se recomienda leer el archivo. En caso contrario el agente recomienda buscar la noticia desde otras fuentes.

El agente formula en su respuesta sintetizada un orden de prioridad de los 3 argumentos más relevantes para tomar esa decisión en base al ranking realizado de atributos.


## Debugging y linteo:

### Estilo de código:

* AIRBNB
[AIRBNB JS CODE STYLE](https://dev.mysql.com/doc/ "AIRBNB JS CODE STYLE")

### Configuración

* Eslint v-4.19.1 // AIRBNB Configuration

### Correción y linteo:

* Chequear errores: `npm run lint`
* Chequear y corregir errores:  `npm run lint-fix` or `npm run lint -- --fix`


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

## Limitaciones

* Los corpus de entrenamiento son demasiado pequeños, lo cuál hace que este proyecto no este funcional de ninguna manera. Este proyecto necesita voluntarios para incrementar, emplolijar y labelear corpus de noticias.
* Los pesos asignados y sus valores son asignados manualmente, a juicio subjetivo.
* No existe aun un dataset con información financiera de los concentrados economicos de medios.
* No necesariamente un clasificador de Bayes es el método más efectivo para clasificar corpus.
* Hay que solicitar permiso para usar el chequeabot de chequeado.
* Avatares animados de BotLibre son limitados, en este caso se eligió uno acorde al theme de diseño, aunque podría haber sido uno sin genero especifico.
* Es una versión BETA no libre de bugs.
* La voz se sintetiza con un motor gratuito de voz libre, esta pensado para el italiano. Para un TTS en español hay que integrar con una solución de cloud que tenga soporte en ese idioma.

## Referencias y bibliografía de soporte:

* Edward S.. Herman, & Chomsky, N. (1988). Manufacturing consent: The political economy of the mass media. London: Vintage.
* Al Jazeera English (2017). Noam Chomsky - The 5 Filters of the Mass Media Machine. Youtube. Retrieved from https://www.youtube.com/watch?v=34LGPIXvU5M

### NPM packages documentation
* LorcaJS: https://github.com/dmarman/lorca

### AHP (Algorithm: Analytic Hierarchy proccess)
* Saaty, T. L. (1986). Axiomatic Foundation of the Analytic Hierarchy Process. Management Science, 32(7), 841. doi:10.1287/mnsc.32.7.841
* Saaty, R. W. (1987). The analytic hierarchy process—what it is and how it is used. Mathematical Modelling, 9(3-5), 167. doi:10.1016/0270-0255(87)90473-8
* Manoj Mathew (2018). Analytic Hierarchy Process (AHP). Youtube. Retrieved from https://www.youtube.com/watch?v=J4T70o8gjlk

### TOPSIS (Algorithm: Technique for Order of Preference by Similarity to Ideal Solution)
* Hwang, C.L.; Yoon, K. (1981). Multiple Attribute Decision Making: Methods and Applications. New York: Springer-Verlag.
* Hwang, C.L.; Lai, Y.J.; Liu, T.Y. (1993). "A new approach for multiple objective decision making". Computers and Operational Research. 20: 889–899
* Değer Alper, Canan Başdar (2017). A Comparison of TOPSIS and ELECTRE Methods: An Application on the Factoring Industry.
* Freire, S. M., Nascimento, A., & de Almeida, R. T. (2018). A Multiple Criteria Decision Making System for Setting Priorities. World Congress on Medical Physics and Biomedical Engineering 2018, 357–361. doi:10.1007/978-981-10-9035-6_65
* Mariana Arburua (2017). Método de Decisión Multicriterio: TOPSIS. Youtube. Retrieved from https://www.youtube.com/watch?v=p8WyEn14Cto


### Razonamiento rebatible en problemas de decisión multi-criterio
* Ferretti, E., Errecalde, M., García, A. J., & Simari, G. R. (2007, May). An application of defeasible logic programming to decision making in a robotic environment. In International Conference on Logic Programming and Nonmonotonic Reasoning (pp. 297-302). Springer, Berlin, Heidelberg.

