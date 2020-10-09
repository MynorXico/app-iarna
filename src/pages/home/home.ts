import {Component, Sanitizer} from '@angular/core';
import {NavController, LoadingController, AlertController, ItemSliding, ToastController} from 'ionic-angular';

import {SurveyProvider} from '../../providers/survey/survey';
import {SurveyDetailsPage} from '../survey-details/survey-details';

import {SurveyModel} from "../../models/survey.model";

import {ApiWrapper} from '../../providers/survey/api-wrapper';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import {Database} from '../../db/database';
import {Peticion} from '../../models/peticion.model';
import {HttpClient} from '@angular/common/http';

import FileManager from '../../files/file_management';
import {Platform} from 'ionic-angular';
import { min } from 'rxjs/operators';
import { platformBrowser, DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {

    surveys: SurveyModel[];
    archiveSurveys: SurveyModel[];
    defaultImages: any;
    // noSurveys: boolean = false;
    currentYear = new Date().getFullYear();
    textoModo: string;
    respuestasPendientes: number;
    modo: boolean;
    peticiones: Peticion[]
    SuccessStatus: boolean = false;
    FailStatus: boolean = false;
    SurveyDownloadFailMessage: string = "Las encuestas NO se descargaron correctamente";
    SurveyDownloadSuccessMessage: string = "Se descargaron las encuestas correctamente";
    NoSurveyErrorMessage: string = "No se pudo obtener encuestas porfavor verifique la conexión a internet.";
    FailMessage: string;
    SuccessMessage: string;
    key: boolean

    constructor(public navCtrl: NavController, public surveyProvider: SurveyProvider,
                public loadingCtrl: LoadingController, public alertCtrl: AlertController, public apiWrapper: ApiWrapper,
                private db: Database, private http: HttpClient,public platform: Platform, public toastCtrl: ToastController,
                public _sanitizer: DomSanitizer
                ) {

        this.platform = platform;

        platform.ready().then(() => {
           this.initCode();
        });

    }

    initCode(){
        this.key = localStorage.getItem('newKey') != null;

        this.modo = (localStorage.getItem('state') == null) 
            ? true 
            : (localStorage.getItem('state') == 'on') ? true : false

        //Creando carpetas
        FileManager.createDirectoryIfDoesntExist('Respuestas/')
        FileManager.createDirectoryIfDoesntExist('Encuestas/')

        this.textoModo = this.modo ? 'Online' : 'Offline';

        if(this.key)
            this.getSurveys();

        this.respuestasPendientes = (localStorage.getItem('responses') == null)
            ? 0
            : Number.parseInt(localStorage.getItem('responses'));
    }

    cambioModo() {
        this.textoModo = this.modo ? 'Online' : 'Offline';
        localStorage.setItem('state',this.modo ? 'on' : 'off')
    }

    ionViewWillEnter(){
        this.obtenerDatosRespuestas();
    }

    obtenerDatosRespuestas() {
        this.db.getRows().then(
            (data) => {
                this.respuestasPendientes = data.rows.length;
                localStorage.setItem('responses', this.respuestasPendientes.toString());
            }
        ).catch((error) => {
            alert("Error: " + JSON.stringify(error));
        })
    }

    /*
        Este metodo obtiene data para pruebas
    */
    ejemploObtenerData() {
        this.peticiones = []
        this.db.getRows().then((res) => {
            if (res.rows.length > 0) {
                for (var i = 0; i < res.rows.length; i++) {
                    this.peticiones.push({
                        id: res.rows.item(i).id,
                        estado: res.rows.item(i).estado,
                        path: res.rows.item(i).path
                    });
                }
            }

            this.peticiones.forEach(item => {
                alert(item.path)
            })
        })
            .catch(e => {
                alert("error " + JSON.stringify(e))
            });
    }

    getSurveys() {
        let loading = this.loadingCtrl.create({
            content: "Cargando encuestas..."
        });
        loading.present();
        if (this.modo) {
            Observable.forkJoin(this.surveyProvider.getActiveSurveys(), this.surveyProvider.getArchiveSurveys())
                .subscribe(async data => {
                        console.log('SurveyData', data);
                        this.surveys = SurveyModel.fromJSONArray(data[0]);

                        // Guardar estas encuestas
                        console.log("Got surveys: ", this.surveys);

                        this.surveys.forEach((value, index) => {
                            let survey_id = value.Id;
                            FileManager.writeFile(survey_id, JSON.stringify(value), 'Encuestas');
                        })
                        //console.log(this.surveys);
                        //this.archiveSurveys = SurveyModel.fromJSONArray(data[1]);
                        loading.dismiss();
                    },
                    error => {
                        console.log(<any>error);
                        if ((error.message == "Failed to get surveys.") || (error.message == "Http failure response for (unknown url): 0 Unknown Error")) {
                            // this.noSurveys = true;
                            this.SuccessStatus = false;
                            this.FailMessage = `${this.NoSurveyErrorMessage} de manera online`
                            this.FailStatus = true;
                            setTimeout(() => {
                                this.SuccessStatus = false;
                                this.FailStatus = false;
                            }, 5000);
                        }
                        loading.dismiss();
                    });
        } else {
            FileManager.getSurveys().then((surveysFromFileSystem) => {
                if (surveysFromFileSystem.length > 0) {
                    this.surveys = SurveyModel.fromJSONArray(surveysFromFileSystem);
                } else {
                    // this.noSurveys = true;
                    this.SuccessStatus = false
                    this.FailMessage = `${this.NoSurveyErrorMessage} de manera offline`
                    this.FailStatus = true;
                    setTimeout(() => {
                        this.SuccessStatus = false
                        this.FailStatus = false
                    }, 5000);
                }
                loading.dismiss();
            });
        }
    }

    downloadSurveys(surveys) {
        this.SuccessStatus = false;
        this.FailStatus = false;
        let loading = this.loadingCtrl.create({
            content: "Descargando encuestas..."
        });
        loading.present().then(() => {
            surveys.forEach(survey => {
                this.http.get('https://dxsurveyapi.azurewebsites.net/api/Survey/getSurvey?surveyId=' + survey.Id).subscribe((response) => {
                    console.log('Questions', JSON.stringify(response));
    
                    FileManager.saveQuestions(survey.Id, JSON.stringify(response), 'Encuestas').then((res) => {
                        if (res === true && this.SuccessStatus === false) {
                            this.FailStatus = false;
                            this.SuccessMessage = this.SurveyDownloadSuccessMessage;
                            this.SuccessStatus = true;
                        } else if (res === false && this.FailStatus === false) {
                            this.SuccessStatus = false;
                            this.FailMessage = this.SurveyDownloadFailMessage;
                            this.FailStatus = true;
                        }
                        setTimeout(() => {
                            this.SuccessStatus = false;
                            this.FailStatus = false;
                        }, 5000);
                    });
                });
                this.sleep(500);
            });
    
            loading.dismiss();
        });
    }

    sleep(milliseconds) {
        const date = Date.now();
        let currentDate = null;
        do {
            currentDate = Date.now();
        } while (currentDate - date < milliseconds);
    }
      

    async uploadSurveys() {
        let loading = this.loadingCtrl.create({
            content: "Subiendo respuestas..."
        });
        loading.present();

        await this.UpdateDBFiles()
            .then(async () => {
                await this.db.deleteRows()
                    .then(() => {
                        loading.dismiss();
                        this.db.getRows().then(
                            (data) => {
                                let pendientes = data.rows.length;
                                if (data.rows.length > 0) {
                                    //alert("Quedaron pendientes " + pendientes + " respuestas de sincronizar. Espere unos minutos y vuelva a sincronizar respuestas.")
                                    let alertMessage = "Quedaron pendientes " + pendientes + " respuestas de sincronizar. Espere unos minutos y vuelva a sincronizar respuestas.";
                                    this.showWrongMessage(alertMessage);
                                }else{
                                    let alertMessage = "Se subieron correctamente las respuestas";
                                    this.showOkMessage(alertMessage);
                                }
                            }
                        ).catch((error) => {
                            alert("Error: " + JSON.stringify(error));
                            loading.dismiss();
                        })
                    })
                    .catch(() => {
                        loading.dismiss();
                    });
            })
            .catch(() => {
                loading.dismiss();
            });

    }

    getActiveSurveys() {
        let loading = this.loadingCtrl.create({
            content: "Cargando encuestas..."
        });

        loading.present();

        this.surveyProvider.getActiveSurveys()
            .subscribe(
                data => {
                    //console.log(data);
                    //this.surveys = data;
                    this.surveys = SurveyModel.fromJSONArray(data);
                    loading.dismiss();
                },
                error => {
                    console.log(<any>error);
                    if ((error.message == "Failed to get surveys.") || (error.message == "Http failure response for (unknown url): 0 Unknown Error")) {
                        this.SuccessStatus = false;
                        this.FailMessage = this.NoSurveyErrorMessage;
                        this.FailStatus = true;
                        setTimeout(() => {
                            this.SuccessStatus = false;
                            this.FailStatus = false;
                        }, 5000);
                    }
                    loading.dismiss();
                }
            );
    }

    async UpdateDBFiles() {
        let resultado = true;

        await this.db.getRows()
            .then(data => {
                if (data.rows.length > 0) {
                    for (let i = 0; i < data.rows.length; i++) {
                        let element = data.rows.item(i);

                        let item: Peticion = {id: element.id, estado: 1, path: element.path};
                        this.db.updateRow(item)
                            .then((res) => {
                                FileManager.getAnswer(element.path.toString())
                                    .then(
                                        answer => {
                                            if (answer.exists) {
                                                let content = JSON.parse(answer.content);
                                                let postData = {
                                                    "postId": content.postId,
                                                    "surveyResult": JSON.stringify(content.respuestas),
                                                }

                                                this.http.post('https://dxsurveyapi.azurewebsites.net/api/Survey/post/', postData, {responseType: 'text'}).subscribe(
                                                    (res) => {
                                                        FileManager.deleteFile(element.path.toString())
                                                            .then((r) => {
                                                                if (r) {
                                                                    item.estado = 2;
                                                                    this.db.updateRow(item)
                                                                        .then((r) => {
                                                                            this.obtenerDatosRespuestas();
                                                                        })
                                                                        .catch((e) => {
                                                                            console.log('Error ', JSON.stringify(e))
                                                                        })
                                                                } else {
                                                                    console.log('No fue posible eliminar el archivo.')
                                                                }
                                                            })
                                                            .catch((e) => {
                                                                console.log('Error ', JSON.stringify(e))
                                                            })
                                                    },
                                                    (err) => {
                                                        resultado = false;
                                                        item.estado = 0;
                                                        this.db.updateRow(item)
                                                            .then((r) => console.log("Se regreso estado a 0, porque no se pudo sincronizar respuesta: " + item.path, JSON.stringify(err)))
                                                            .catch((e) => console.log('Error ', JSON.stringify(e)));
                                                    }
                                                );
                                                this.sleep(500);
                                            } else {
                                                this.db.deleteRow(element.id)
                                                    .then(() => {
                                                        alert("No existe el archivo: " + element.path)
                                                    });
                                            }
                                        }
                                    )
                                    .catch(
                                        error => {
                                            console.log(error);
                                            resultado = false;
                                        }
                                    );
                            })
                            .catch((error) => {
                                console.log("No fue posible actualizar registro ", JSON.stringify(element), JSON.stringify(error));
                                resultado = false;
                            })
                    }
                }
                else {
                    alert("No existen respuestas pendientes de sincronizar");
                    resultado = false;
                }
            })
            .catch(
                err => {
                    console.log('Error: ' + err.message);
                    resultado = false;
                }
            );

        return resultado;
    }

    // getArchiveSurveys() {
    //     this.surveyProvider.getArchiveSurveys()
    //         .subscribe(
    //             data => {
    //                 //console.log(data);
    //                 this.archiveSurveys = SurveyModel.fromJSONArray(data);
    //             },
    //             error => {
    //                 console.log(<any>error);
    //                 if ((error.message == "Failed to get surveys.") || (error.message == "Http failure response for (unknown url): 0 Unknown Error")) this.noSurveys = true;
    //         }
    //     );
    // }

    selectedSurvey(survey) {
        console.log('Mode', this.modo);
        this.navCtrl.push(SurveyDetailsPage, {
            survey: survey,
            mode: this.modo
        });
    }

    presentAlert({
                     survey = null,
                     operation = '',
                 } = {}) {
        let options = this.alertConfig(operation);
        let alert = this.alertCtrl.create({
            title: options.title,
            subTitle: options.subTitle,
            buttons: [
                {
                    text: 'Cancel',
                    handler: () => {
                    }
                },
                {
                    text: 'Accept',
                    handler: () => {
                        if (operation == 'delete') this.deleteSurvey(survey);
                        if (operation == 'activate') this.activateSurvey(survey);
                        //if (operation == 'archive') this.archiveSurvey(survey);
                        if (operation == "create") this.createSurvey("New Survey :)");
                    }
                }
            ]
        });
        alert.present();
    }

    showWrongMessage(message: string){
        this.SuccessStatus = false;
        this.FailMessage = message;
        this.FailStatus = true;
        setTimeout(() => {
            this.SuccessStatus = false;
            this.FailStatus = false;
        }, 5000);
    }  

    showOkMessage(message: string){
        this.FailStatus = false;
        this.SuccessMessage = message;
        this.SuccessStatus = true;
        setTimeout(() => {
            this.SuccessStatus = false;
            this.FailStatus = false;
        }, 5000);
    }

    showPromptDelteAnswersSend(){
        FileManager.deleteSurveysAnswersFileEmpty().then((res)=>{
            if (res === true) {
                this.FailStatus = false;
                this.SuccessMessage = "Se borraron correctamente las respuestas";
                this.SuccessStatus = true;
            } else {
                this.SuccessStatus = false;
                this.FailMessage = "No se borraron correctamente las respuestas, intenta nuevamente";
                this.FailStatus = true;
            }
            setTimeout(() => {
                this.SuccessStatus = false;
                this.FailStatus = false;
            }, 5000);
        });
    }

    showPromptTrash(survey, slidingItem: ItemSliding) {
        let prompt = this.alertCtrl.create({
            title: 'Limpiar archivos de respuestas',
            message: "¿Esta seguro que deseas eliminar las respuestas? Puede que estas no hayan sido sincronizadas",
            buttons: [
                {
                    text: 'Cancelar',
                    handler: data => {

                    }
                },
                {
                    text: 'Aceptar',
                    handler: data => {
                        FileManager.deleteSurveysAnswers().then((res) => {
                            if (res === true) {
                                this.FailStatus = false;
                                this.SuccessMessage = "Se borraron correctamente las respuestas";
                                this.SuccessStatus = true;
                            } else {
                                this.SuccessStatus = false;
                                this.FailMessage = "No se borraron correctamente las respuestas, intenta nuevamente";
                                this.FailStatus = true;
                            }
                            setTimeout(() => {
                                this.SuccessStatus = false;
                                this.FailStatus = false;
                            }, 5000);
                        });
                    }
                }
            ]
        });
        prompt.present();
    }

    showPrompt(survey, slidingItem: ItemSliding) {
        let prompt = this.alertCtrl.create({
            title: 'Actualizar clave de acceso para cargar encuestas',
            message: "Ingrese la nueva clave de acceso",
            inputs: [
                {
                    name: 'name',
                    //placeholder: 'Name'
                },
            ],
            buttons: [
                {
                    text: 'Cancelar',
                    handler: data => {
                        //console.log('Cancel clicked');
                    }
                },
                {
                    text: 'Aceptar',
                    handler: data => {
                        //console.log('Accept clicked');
                        //console.log(data);
                        //this.changeSurveyName(survey, data.name, slidingItem);
                        //this.surveyProvider.NewKey=data.name;
                        localStorage.setItem("newKey", data.name);
                        location.reload();
                    }
                }
            ]
        });
        prompt.present();
    }

    showPrompt1(survey, slidingItem: ItemSliding) {
        let prompt = this.alertCtrl.create({
            title: '<div align="center"> Creditos </div>',
            message: "<b> Bryan Macario </b> <br>" 
            + "<b> Derek Menendez </b> <br>" 
            + "<b> Harry Caballeros </b> <br>" 
            + "<b> Mynor Xico </b> <br>" 
            + "<b> Sebastian Bonilla </b> <br>",

            buttons: [

                {
                    text: 'Aceptar',

                }
            ]
        });
        prompt.present();
    }

    createSurvey(name) {
        let loading = this.loadingCtrl.create({
            content: "Creating Survey..."
        });

        loading.present();

        this.surveyProvider.createSurvey(name)
            .subscribe(
                data => {
                    //console.log(data);
                    let survey: SurveyModel = new SurveyModel(data);
                    this.surveys.unshift(survey);
                    loading.dismiss();
                },
                error => {
                    console.log(<any>error);
                    loading.dismiss();
                }
            );
    }


    deleteSurvey(survey) {
        let loading = this.loadingCtrl.create({
            content: "Deleting Survey..."
        });

        loading.present();

        this.surveyProvider.deleteSurvey(survey.Id)
            .subscribe(
                data => {
                    console.log(data);
                    loading.dismiss();
                },
                error => {
                    console.log(<any>error);
                    if (error.status == 200) {
                        if (survey.IsArchived === false) this.surveys = this.removeElement(survey.Id, this.surveys);
                        //else this.archiveSurveys = this.removeElement(survey.Id, this.archiveSurveys);
                    }
                    loading.dismiss();
                }
            );
    }

    changeSurveyName(survey, newName, slidingItem) {
        let loading = this.loadingCtrl.create({
            content: "Updating Survey name..."
        });

        loading.present();

        this.surveyProvider.changeSurveyName(survey.Id, newName)
            .subscribe(
                data => {
                    console.log(data);
                    slidingItem.close();
                    loading.dismiss();
                },
                error => {
                    console.log(<any>error);
                    if (error.status == 200) {
                        survey.Name = newName;
                        slidingItem.close();
                    }
                    loading.dismiss();
                }
            );
    }

    activateSurvey(survey) {
        let loading = this.loadingCtrl.create({
            content: "Activating Survey..."
        });

        loading.present();

        this.surveyProvider.restoreSurvey(survey.Id)
            .subscribe(
                data => {
                    console.log(data);
                    loading.dismiss();
                },
                error => {
                    console.log(<any>error);
                    if (error.status == 200) {
                        this.surveys.push(survey);
                        this.archiveSurveys = this.removeElement(survey.Id, this.archiveSurveys);
                    }
                    loading.dismiss();
                }
            );
    }

    // archiveSurvey(survey) {
    //     let loading = this.loadingCtrl.create({
    //         content: "Archiving Survey..."
    //     });

    //     loading.present();

    //     this.surveyProvider.archiveSurvey(survey.Id)
    //     .subscribe(
    //         data => {
    //             console.log(data);
    //             loading.dismiss();
    //         },
    //         error => {
    //             console.log(<any>error);
    //             if (error.status == 200) {
    //                 this.archiveSurveys.push(survey);
    //                 this.surveys = this.removeElement(survey.Id, this.surveys);
    //             }
    //             loading.dismiss();
    //         }
    //     );
    // }

    removeElement(surveyId, surveys) {
        return surveys.filter(function (e) {
            return e.Id !== surveyId;
        });
    }

    alertConfig(operation) {
        let options = {
            delete: {title: 'Delete Survey', subTitle: '¿Are you sure to delete the survey?'},
            activate: {title: 'Activate Survey', subTitle: '¿Are you sure to activate the survey?'},
            archive: {title: 'Archive Survey', subTitle: '¿Are you sure to archive the survey?'},
            create: {title: 'Create Survey', subTitle: '¿Are you sure to create new survey?'}

        }
        return options[operation];
    }

    showHelp(){
        let content = `
                <style>
                    .alert-md .alert-wrapper {
                        max-width: 800px
                    }
                    .help-item {
                        padding: 10px 0 10px 0
                    }
                </style>
                <div class='help-item'>
                    <div style="text-align: center">
                        <button  style=" background-color: #72bfdd;" class="button-download button button-md button-default button-default-md" ion-button="">
                            <span class="button-inner">
                                <ion-icon name="cloud-download" role="img" class="icon icon-md ion-md-cloud-download" aria-label="cloud download" ng-reflect-name="cloud-download"></ion-icon>
                            </span>
                            <div class="button-effect" style="transform: translate3d(-19px, -17px, 0px) scale(1); height: 70px; width: 70px; opacity: 0; transition: transform 279ms ease 0s, opacity 195ms ease 84ms;"></div>
                        </button>
                    </div>
                    <div style="text-align: center">
                        Se utiliza para descargar el contenido de <b> SurveyJS. </b>
                    </div>
                </div>
                <div class='help-item'>
                    <div style="text-align: center">
                        <button class="button-upload button button-md button-default button-default-md" ion-button="">
                            <span class="button-inner">
                                <ion-icon name="cloud-upload" role="img" class="icon icon-md ion-md-cloud-upload" aria-label="cloud upload" ng-reflect-name="cloud-upload"></ion-icon>
                            </span>
                            <div class="button-effect" style="transform: translate3d(-19px, -17px, 0px) scale(1); height: 70px; width: 70px; opacity: 0; transition: transform 279ms ease 0s, opacity 195ms ease 84ms;"></div>
                        </button>
                    </div>
                    <div style="text-align: center">
                        Se utiliza para enviar las encuestas que se encuentran en el teléfono hacia internet. <b>Antes de presionar este botón debe asegurarse que se cuenta con una conexión estable a internet  </b>.
                    </div>
                </div>
                <div class='help-item'>
                    <div style="text-align: center">
                        <button style="color: black; background-color: #72bfdd; border-radius: 100%" class="button-upload button button-md button-default button-default-md" ion-button="">
                            <span class="button-inner">
                                <ion-icon name="build" role="img" class="icon icon-md ion-md-build" aria-label="build" ng-reflect-name="build"></ion-icon>
                            </span>
                            <div class="button-effect"
                                style="transform: translate3d(-16px, -16px, 0px) scale(1); height: 65px; width: 65px; opacity: 0; transition: transform 277ms ease 0s, opacity 194ms ease 83ms;">
                            </div>                        
                        </button>
                    </div>
                    <div style="text-align: center">
                        Al presionar este botón, se solicitará la clave de acceso de la cuenta de SurveyJS.
                    </div>
                </div>        
        `;
        let prompt = this.alertCtrl.create({

            
            title: '<div align="center"> Ayuda </div>',
            message: <any> this._sanitizer.bypassSecurityTrustHtml(content),

            buttons: [

                {
                    text: 'Aceptar',

                }
            ]
        });
        prompt.present();
    }

    ngOnDestroy(){
        this.obtenerDatosRespuestas();
    }


}