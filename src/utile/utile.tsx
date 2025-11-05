import { AppConfig } from '../models/AppConfig';
// import {getInstance} from "http-proxy-middleware/dist/logger";

export async function loadConfig(): Promise<AppConfig> {
    const response = await fetch('${import.meta.env.BASE_URL}config/config.json');
    console.log("****************** SUNT IN LOADcONFIG **************");
    console.log(response);
    console.log("///// raspuns");

    if (response.status!=200) {
        console.error('Failed to load configuration', response.statusText);
        return { BASE_URL: '',REACT_APP_API_URL: '' };
    }

    let config = response.json().then(a=>{
        if(typeof a=="object"){
            return a as AppConfig;
        }else{
            return {BASE_URL: '',REACT_APP_API_URL: ''}
        }

    }).catch(e=>{return {BASE_URL: '',REACT_APP_API_URL: ''} as AppConfig});

    console.log(config);
    console.log("->->===============================|||||||||||||||||||||-----------");

    return config;
}