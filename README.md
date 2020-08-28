# IARNA
Aplicacion movil de encuestas utilizando surveyJS


Links para los tutoriales

Video de instalacion en la PC de la aplicacion 
https://drive.google.com/file/d/1RvZPeX9F6Ef9-dyX_CQptf4WqLAQ1nSi/view?usp=sharing

Video para generar el apk
https://drive.google.com/file/d/1h1ePca3NKt8GrVZggdXBLpEFaiGE22J9/view


Funcionamiento de la aplicacion WEB de Survey


Primero nos logeamos en SurveyJS o creamos una cuenta para manejar nuestras encuestas.
![login](https://user-images.githubusercontent.com/37817818/66236801-aba72000-e6b0-11e9-82d7-2ce446f49a53.jpg)

Luego al darle click en SERVICE--> My surveys, se desplegaran todas las encuestas creadas que tiene activas
![2](https://user-images.githubusercontent.com/37817818/66237876-63d5c800-e6b3-11e9-9480-4855e2e17e5c.jpg)

Podemos observar que esta el boton para crear nueva encuestas, y que cada encuesta posee sus botones en este caso los mas importante son Run que es para probar la encuesta, Results que es para observar los resultados de la encuesta, clone para duplicar la encuesta con las mismas caracteristicas y arhive que guardas las encuestas como tipo archivadas.

Al darle click en archive survey despliega todas las encuestas archivadas.
![3](https://user-images.githubusercontent.com/37817818/66238014-c6c75f00-e6b3-11e9-8951-0350cb6f1ccc.jpg)

Si escojemos alguna en escuesta esta desplegara una pantalla en donde se podra modificar la encuesta
![4](https://user-images.githubusercontent.com/37817818/66238088-f9715780-e6b3-11e9-8f99-af66009a5524.jpg)

Ademas se puede ver que tiene varias opciones donde test survey es para probar la encuesta, JSON Editor muestra el JSOn de la encuesta.

Al darle click en test survey despliega una nueva ventana con la encuesta para llenarla y observar si todo esta correcto.
![5](https://user-images.githubusercontent.com/37817818/66238229-4ce3a580-e6b4-11e9-89fe-ea60b470429e.jpg)

Al darle click en JSON editor se muestra el JSON como se meciono antes para hacer uso del codigo de ser necesario.
![6](https://user-images.githubusercontent.com/37817818/66238244-5a992b00-e6b4-11e9-86b5-3a41a27f69c7.jpg)

En el menu donde salen todas las encuestas al hacer click results se mostraran los resultados, y estos se pueden observar y exportar de ser necesario.
![7](https://user-images.githubusercontent.com/37817818/66238359-b19f0000-e6b4-11e9-847b-b351cefd5bc6.jpg)

Funcionamiento de la aplicacion MOVIL de Survey

Lo primero sera obtener el access key para tener acceso a todas las encuestas de la aplicacion para ello sera necesario ingresar al link y loguearse:
Nos logueamos utilizando el siguiente link
https://surveyjs.io/Account/Login/
Luego ingresamos al siguiente link obtener el access key
https://surveyjs.io/Help/Api/GET-api-MySurveys-deleteAllResults-id_accessKey

Debera desplegar una pagina similar a esta donde lo subrayado desplegara el access key.
![9](https://user-images.githubusercontent.com/37817818/66238510-fc207c80-e6b4-11e9-8001-3edf18fe5e0a.jpg)

Luego instalaremos el APK de la aplicacion. Al iniciar la aplicacion no se mostrara ninguna encuestas mas que una pantalla blanca, lo siguiente sera ingresar el acces key
![12](https://user-images.githubusercontent.com/37817818/66239312-ca101a00-e6b6-11e9-956c-d2290b1f77cc.png)
Al ingresar el access key este automaticamente carga las encuestas.
![10](https://user-images.githubusercontent.com/37817818/66239349-e2803480-e6b6-11e9-98dd-fe673ecbbd0a.jpg)

El programa solo mostrara las encuestas que esten activas en la aplicacion WEB, y una vez cargadas al hacer click empieza la encuesta.

![13](https://user-images.githubusercontent.com/37817818/66239412-080d3e00-e6b7-11e9-8439-3651c0a04958.jpg)

Una vez realizada la encuesta le damos en el boton completo y este automaticamente guarda la encuesta en la aplicacion web.

