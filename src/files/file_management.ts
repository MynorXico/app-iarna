import {DirectoryEntry, File} from "@ionic-native/file";

export default class FileManager {

    constructor() {
    }

    static getFileManager() {
    }

    /*
        Verifica si existe un directorio en la ruta path/dirName
        path debe finalizar con slash /
    */
    static async directoryExists(dirName, path = "") {
        const file = new File();
        let dir_exists = false;
        await file.checkDir(file.dataDirectory + path, dirName)
            .then(_ => {
                dir_exists = true;
                console.log("Directory exists: " + file.dataDirectory + path + dirName);
            })
            .catch(err => {
                console.log("Error directory not found: ", +file.dataDirectory + path + dirName, err);
                dir_exists = false;
            })
        return dir_exists;
    }


    static async saveQuestions(filename, current_questions, path = "") {
        console.log('guardando preguntas')
        try {
            let current_content = await this.readFile(path, filename);
            let new_content = JSON.parse(current_content);
            console.log('el contenido')
            console.log(new_content)
            new_content['questions'] = current_questions;
            return this.writeFile(filename, JSON.stringify(new_content), path);
        } catch (err) {
            console.log('save Question error : ' + path + "/" + filename, err);
            return true;
        }
    }

    /*
        Crea un archivo en la ruta path/filename y le escribe content
    */
    static async writeFile(filename, content, path = "") {
        console.log({
            filename,
            content,
            path
        });
        const file = new File();
        let file_written = false;
        await file.writeFile(file.dataDirectory + path, filename, content, {
            replace: true
        }).then(_ => {
            file_written = true;
            console.log("File " + file.dataDirectory + path + "/" + filename + " was written");
        }).catch(err => {
            console.log("Failed at writing " + file.dataDirectory + path + "/" + filename, err)
            file_written = false;
        });
        console.log("File content: " + await this.readFile(path, filename));
        return file_written;
    }

    static async getQuestions(surveyId) {
        console.log(`obteniendo preguntas ${surveyId}`)
        let current_content = await this.readFile('Encuestas', surveyId);
        return JSON.parse(current_content).questions;
    }

    static async getSurveys() {
        let surveys = new Array();
        if (this.directoryExists('Encuestas')) {
            const file = new File();
            try {
                let files = await file.listDir(file.dataDirectory, 'Encuestas');
                console.log(files);
                for (const file of files) {
                    if (file.isFile) {
                        let survey = JSON.parse(await this.readFile('Encuestas', file.name));
                        surveys.push(survey);
                    }
                }
            } catch (err) {
                console.log(err);
            }
        }
        return surveys;
    }

    static async getAnswers() {
        let finalAnswers = new Array();
        if (this.directoryExists('Respuestas')) {
            const file = new File();
            try {
                let surveys = await file.listDir(file.dataDirectory, 'Respuestas');
                console.log('Survey', surveys);
                for (const survey of surveys) {
                    if (survey.isDirectory) {
                        console.log(file.dataDirectory + 'Respuestas')
                        let answers = await file.listDir(file.dataDirectory, 'Respuestas/' + survey.name);
                        console.log('Answers', answers);
                        for (const answer of answers) {
                            if (answer.isFile) {
                                let answerFromFile = JSON.parse(await this.readFile('Respuestas/' + survey.name, answer.name));
                                finalAnswers.push(answerFromFile);
                            }
                        }
                        ;
                    }
                }
                ;
            } catch (err) {
                console.log(err);
            }
        }
        return finalAnswers;
    }

    static async getAnswer(path: string) {

        let answer = {exists: true, content: ''};

        try {
            let temp = path.split('/');
            let filename: string = temp.splice(temp.length - 1, 1)[0];
            let dir: string = temp.join('/');

            if (await this.checkFile(dir + '/', filename)) {
                answer.content = await this.readFile(dir, filename);
                answer.exists = true;
            } else {
                answer.exists = false;
            }

            return answer
        }
        catch (err) {
            return err
        }
    }

    /*
        Devuelve el contenido del archivo path/file
    */
    static async readFile(path: string, filename: string) {
        const file = new File();
        console.log(file.dataDirectory + path);
        return await file.readAsText(file.dataDirectory + path, filename);
    }

    static async checkFile(path, name) {
        const file = new File();

        let file_exists = false;

        await file.checkFile(file.dataDirectory + path, name)
            .then(_ => {
                file_exists = true;
            })
            .catch(err => {
                file_exists = false;
            })

        return file_exists;
    }


    /*
        Crea un directorio si aún no existe uno en la ruta path/dirName
        path debe finalizar con slash /
    */
    static async createDirectoryIfDoesntExist(dirName, path = "") {
        const file = new File();
        let dir_created = false;
        if (await this.directoryExists(dirName, path)) {
            return true;
        } else {
            file.createDir(file.dataDirectory + path, dirName, false).then(
                _ => {
                    dir_created = true;
                }
            ).catch(
                err => {
                    console.log('Error (Directory Creation): ', err);
                    dir_created = false;
                }
            );
        }
        return dir_created;
    }

    static async createAnswersDirectoryIfDoesntExists(dirName, path=""):Promise<boolean>{
        const file = new File();
        let flag = false;
        
        await file.checkDir(file.dataDirectory + path, dirName)
        .then(() => {
            flag = true;
        })
        .catch(async () => {
            console.log("Directory not exists: ", file.dataDirectory + path + dirName);
            await file.createDir(file.dataDirectory + path, dirName, false)
            .then((response)=>{
                console.log("Directory created successfully", JSON.stringify(response))
                flag = true;
            })
            .catch((error)=>{
                console.log("Error: ", JSON.stringify(error))
                flag = false;
            })
        })

        return flag;
    }

    /*
       Obtiene un nombre disponible para la respuesta en el path indicado.
    */
    static async getFileName(dirName, path = "") {
        let i: number = 1;
        let name: string = dirName;
        let exists: boolean = true;
        const file = new File();

        while (exists) {
            await file.checkFile(file.dataDirectory + path, name)
                .then(_ => {
                    i++;
                    name = 'Respuesta_' + i.toString();
                    exists = true;
                })
                .catch(e => {
                    console.log("Error directory not found: " + file.dataDirectory + path + name);
                    exists = false;
                })
        }

        return name;
    }

    static async deleteFile(path = "") {
        let temp = path.split('/');
        let filename = temp.splice(temp.length - 1, 1).toString();
        let dir = temp.join('/');

        const file = new File();

        let result = await file.removeFile(file.dataDirectory + dir + '/', filename);

        return result.success;
    }

    /*
       Borra unicamente las encuestas. Se utiliza en el botón borrar. 
    */

    static async deleteSurveysAnswers() {
        var EncuestasDeleted = false;
        if (this.directoryExists('Encuestas')) {
            const fileObj = new File();
            try {
        
                let filesEncuestas = await fileObj.listDir(fileObj.dataDirectory, 'Encuestas');
                
                for (const file of filesEncuestas) {
                    if (file.isFile) {
                        fileObj.removeFile(fileObj.dataDirectory + 'Encuestas/', file.name);
                    }
                }
                ;
                EncuestasDeleted = true;
                return true;
            } catch (err) {
                console.log("delete survey files error Encuestas : ", err);
                return false;
            }
        }
        return false;
    }

    static async deleteSurveysAnswersFileEmpty() {
        var EncuestasDeleted = false;
        var content = []; 
        if (this.directoryExists('Encuestas')) {
            const fileObj = new File();
            try {
                let filesEncuestas = await fileObj.listDir(fileObj.dataDirectory, 'Encuestas');
                
                for (const file of filesEncuestas) {
                    if (file.isFile) {
                        console.log(" NOMBRE DIR ANTES DE BORRAR" +  file.name)
                        content = await fileObj.listDir(fileObj.dataDirectory, 'Encuestas/'+file.name);;
                        if(content.length == 0){
                            fileObj.removeFile(fileObj.dataDirectory + 'Encuestas/', file.name);
                        }
                    }
                }
                ;
                EncuestasDeleted = true;
                return true;
            } catch (err) {
                console.log("delete survey files error Encuestas : ", err);
                return false;
            }
        }
        return false;
    }
}