import MapStocOtim from "./models/MapStocOtim";
import HttpResponse from "./models/HttpResponse";
import User from "./models/User";
// import {getEnvVariables} from "./utility/envUtils";
// asta era  import {globalConfig, loadConfig} from './config/configLoader';
// let env = getEnvVariables();
import {AppConfig} from "./models/AppConfig";
import {loadConfig} from "./utile/utile";
import RegisterUser from "./models/RegisterUser";

export default class Api{

   async api<T, U>(path: string, method = "GET", body: U,token:string|null): Promise<HttpResponse<T>> {

        // -----------------------------------------------------
        let basepath=await this.getBaseURL();
        console.log("Am obtinut baseurl="+basepath)
        // let basepath = await this.getBaseURL();
        console.log(basepath);
        if (!basepath) {
            console.log("++ Nu aveam basepath")
            basepath = "http://localhost/kong"; // fallback if config fails
        }
        // basepath="http://react-app.local";

       const url= basepath+path;

       // const url= "http://nserver:8083/api/v1/server"+path;

       // const url=basepath+"/server"+path;
        // const url= basepath+"/server"+ path;

        //
        console.log("URL DE INTEROGARE="+url);
        console.log("###############################################################")
        const options: RequestInit = {
            method,
            mode:"cors",
            headers:{
                "Content-Type" : "application/json;charset=utf-8"
            },
            body: body == null ? null : JSON.stringify(body)
        }
        if (token !== null) {
            options.headers = {
                ...options.headers,
                Authorization: `Bearer `+token,
            };
        }
        console.log("Token="+token);
        return fetch(url, options)
    }

    // let config = useConfig();


    getBaseURL=async () =>{
        console.log("--------------IN GETBASEURL")
        try {
            let response = await loadConfig();
            console.log("^^^^^^ din getBaseURL");
            console.log(response);
            console.log("======================______=======================");
            return response.VITE_API_URL;
        }catch (e) {
            return Promise.reject("Error");
        }


    }
    loadEnvVariables=async ()=>{
        // try{
        //     await loadConfig();
        //     return process.env.NODE_ENV;
        // }catch (e){
        //
        // }

    }

    queryGetAllMapStoc = async (tokenString:string): Promise<MapStocOtim[]> => {

        // let data = await this.api("/qallmap", "GET", null,tokenString);
        let data = await this.api("/query", "GET", null,tokenString);
        if(data.status===200){
            return await data.json();
        }else {
            return Promise.reject([]);
        }

    }

    comGetAllMapStoc = async (tokenString:string): Promise<MapStocOtim[]> => {

        // let data = await this.api("/comallmap", "GET", null,tokenString);
        let data = await this.api("/command/getallmap", "GET", null,tokenString);


        if(data.status===200){
            return await data.json();
        }else {
            return Promise.reject([]);
        }

    }


    registerUser = async (newUser:RegisterUser): Promise<String> => {

        // let data = await this.api("/comallmap", "GET", null,tokenString);
        let data = await this.api("/auth/register", "POST", newUser,null);

        console.log("Raspuns din API");
        console.log(data);
        console.log("--------------------------------");

        if(data.status===200){
            return "OK REGISTER";
        }else {
            return Promise.reject([]);
        }

    }


    bulkAddMapStoc = async (newProd:MapStocOtim[],tokenString:string): Promise<boolean> => {

        // let data = await this.api("/addbulk", "POST", newProd,tokenString);
        let data = await this.api("/command/bulk", "POST", newProd,tokenString);

        if(data.status===200){
            return data.json();
        }else {
            return Promise.reject([]);
        }

    }

    updMapStoc = async (newProd:MapStocOtim,tokenString:string): Promise<boolean> => {

        // let data = await this.api("/upd", "POST", newProd,tokenString);
        let data = await this.api("/command/update", "POST", newProd,tokenString);


        if(data.status===200){
            return data.json();
        }else {
            return Promise.reject([]);
        }

    }


    delMapStoc = async (delProd:string,tokenString:string): Promise<boolean> => {

        // let data = await this.api("/del/"+delProd, "DELETE", null,tokenString);
        let data = await this.api("/command/del/"+delProd, "DELETE", null,tokenString);

        if(data.status===200){
            console.log("am primit status ok pentru "+delProd);
            return data.json();
        }else {
            return Promise.reject([]);
        }

    }

    login=async (user:User):Promise<User>=>{
        // let x=loadConfig()
        console.log("La LOGIN cu ");
        // console.log(globalConfig!.apiUrl);
        let response:HttpResponse<string>=await this.api("/login","POST", user,null);
        // let response:HttpResponse<string>=await this.api("http://localhost:8080/api/v1/server/login","POST", user,null);

        console.log(response);


        if(response.status===200){

             return response.json();
        }else{

             return Promise.reject("Eroare de logare")
        }

    }

    register=async (user:User):Promise<string>=>{
        let response:HttpResponse<string>=await this.api<string,User>("/register","POST", user,null);
        alert("INNNNNNNN REGISTER")
        if(response.status===200){

            return response.text();
        }else{

            return Promise.reject("Register Error!!")
        }

    }

}