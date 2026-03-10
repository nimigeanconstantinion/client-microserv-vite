import {useDispatch, useSelector} from "react-redux";
import {
    selectQMapStocOpt,
    selectRetrieveMapStocOptState,
    selectTotObjSate
} from "../../store/queryMapStocOptim/queryMapStocOpt.selector";
import '../../index.css';

import '../../App.css';

import {selLoadAuthToken, selLoadAuthUser, selLoginRegisterStatus} from "../../store/authorization/auth.selector"
import {loadCMDMap} from "../../store/comMapStocOptim/comMapStocOptim.selector";
import React, {ChangeEvent, useEffect, useRef, useState} from "react";
import MapStocOtim from "../../models/MapStocOtim";
import {
    delMapElement,
    loadComMapStocList,
    retrieveComMapStocListLoading,
    retrieveComMapStocListSucces,
    retriveTotalObjects,
    updateMapStocWk,
    updMapElem
} from "../../store/comMapStocOptim/comMapStocOptim.reducer";
import Api from "../../Api";
import {
    loadMapStocList,
    retrieveMapStocListError,
    retrieveMapStocListLoading,
    retrieveMapStocListSucces,
    setTotalObjects
} from "../../store/queryMapStocOptim/queryMapStocOpt.reducer";
import store from "../../store/store";
import myImg from "./spinner.gif"
// require('../../Images/spinner.gif');

import Myspin from "../imagine/index";

 import spinner from "../assets/spinner.gif";


// import {ReactComponent as Spinner} from "../../Images/tube-spinner.svg";

import {ReactComponent as Spinner} from "./spinner.gif";

//  import {ReactComponent as Spinner} from "../../Images/spinner.gif";

// import ripp from "../../Images/ripples.svg"

// import spinn from "build/static/media/spinner.90672f1deffccbcdf4f1.gif"

// import myimg from '../../Images/logo192.png';
import WrapperNewHome from "./IndexStyle";
import Grid from "../GridComp/index"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFloppyDisk, faTrash} from '@fortawesome/free-solid-svg-icons';
import {Tooltip} from "react-bootstrap";
// import Spinner from 'react-bootstrap/Spinner';

import MyTooltip from "./../OverlayMess/Index"
import ConfirmBox from "../ConfirmBox";
import Login from "../Login";
import Register from "../Register";
// import KeycloakLogin from "../auth/KeycloakLogin";
import KeycloakLogin from "../auth/CustomLogin";

const Homes:React.FC=()=> {
    let qMapStocList = useSelector(selectQMapStocOpt);
    let cMapStocList=useSelector(loadCMDMap);
    let myToken=useSelector(selLoadAuthToken);
    let loginRegStatus=useSelector(selLoginRegisterStatus);
    let authUser=useSelector(selLoadAuthUser);
    const [newObLst,setNewObLst]=useState<MapStocOtim[]>([]);
    const [spin,setSpin]=useState(0);
    const [showGrd,setShowGrd]=useState(0);
    const [totPag,setTotPag]=useState<number[]>([]);
    const [grupPag,setGrupPag]=useState(0);
    const[pst,setpst]=useState(0);
    const[psf,setpsf]=useState(0);
    const refSrc=useRef<string>("");
    const [shUtil,setShUtil]=useState(0);
    const [showLogin,setShowLogin]=useState(0);
    const [showRegister,setShowRegister]=useState(0);
    const storage = window.localStorage;
    const [storageL,setStorageL]=useState(0);
    const [shMess,setShMess]=useState(0);

    const [focussd,setFocussed]=useState<MapStocOtim|null>(null);

    const [pgSel,setPgSel]=useState(1);
    const [wkLst,setWkLst]=useState<MapStocOtim[]>([]);
    let totObj=useSelector(selectTotObjSate);
    let totComObj=useSelector(retriveTotalObjects);
    const [comTotObj,setComTotObj]=useState(0);
    const [chgr,setChGr]=useState(0);
    const [totOb,setTotob]=useState(0);
    let qRetrieve=useSelector(selectRetrieveMapStocOptState);

    const dispatch = useDispatch();
    //
    const tooltip = (
        <Tooltip id="tooltip">
            <strong>Holy guacamole!</strong> Check this info.
        </Tooltip>
    );

    useEffect(()=>{
        console.log("Am intrat");
        console.log(spinner);
        setGrupPag(0);

    },[])

    // const spinimage=require("../../Images/spinner.gif")
    useEffect(()=>{

        console.log("Effect Pst="+pst);

    },[pst])

    useEffect(()=>{
        console.log("Effect PsFF="+psf);

    },[psf])


    useEffect(()=>{
        console.log("------------------------in use effect grup-----------------------");
        console.log("GRUPUL="+grupPag);
        console.log(totPag);
        console.log("ATENTIEEEE Lista de articole are lungimea="+wkLst.length);
        const length = storage.length;

        console.log("Marimea storage-ului este"+length);

        let maxPag=Math.floor(wkLst.length/100)+1;
        console.log("Max pag este "+maxPag);
        if(maxPag==0){
            maxPag=1;
        }
        let maxgrp=Math.floor(wkLst.length/1000)+1;
        console.log("Max Grp="+maxgrp);
        if(wkLst.length==0){
            setpst(0)
            setpsf(0)
        }
        if(grupPag<maxgrp&&grupPag>=1){
            setpst((grupPag-1)*10+1);
            setpsf(grupPag*10);
        }else{
            if(grupPag==maxgrp){
                setpst((grupPag-1)*10+1);
                setpsf(maxPag);
            }
        }


    },[grupPag])

    useEffect(()=>{
        console.log("Schimb lista");
        console.log(wkLst);

        let nrPx=Math.floor(wkLst.length/100)+1;
        if(nrPx==0){
            setTotPag([1])
        }else{
            let x:number[]=[];
            for(let i=1;i<=nrPx;i++){
                x.push(i);
            }
            setTotPag(x);
        }


    },[wkLst]);

    let qLoad=async ()=>{
        console.log("Sunt in qLoad");
        let api=new Api();
        setSpin(1);
        // setGrupPag(1);
        setWkLst([]);
        setShowGrd(0);
        dispatch(retrieveMapStocListLoading())
        console.log("Tokenul meu este "+myToken)
        if(myToken!=null){
                console.log("Sunt innnn");
            try {
                let res = await api.queryGetAllMapStoc(myToken);
                dispatch(retrieveMapStocListSucces());
                dispatch(loadMapStocList(res));
                const n:number=40;
                dispatch(setTotalObjects(res.length));
                setTotob(res.length)
                dispatch(retrieveComMapStocListLoading());
                let comresp=await api.comGetAllMapStoc(myToken!);
                dispatch(retrieveComMapStocListSucces());
                if(comresp.length>0){
                    await comresp.sort((a,b)=>a.categorie.localeCompare(b.categorie));
                    console.log("Gata 1");
                    await comresp.sort((a,b)=>a.grupa.localeCompare(b.grupa));
                    console.log("gata 2");
                    dispatch(loadComMapStocList(comresp));
                    setComTotObj(comresp.length);
                    setWkLst(comresp);
                }
                await getListNews();
                setSpin(0);
            } catch (error) {
                dispatch(retrieveMapStocListError());
            }
        }else{

        }
    }


    let getListNews=async ():Promise<void>=>{
        console.log("Am intrat");
        const length = storage.length;

        console.log("Marimea storage-ului este"+length);

        let qlst:MapStocOtim[]=store.getState().queryMapStocState.queryMapList;
        let clst:MapStocOtim[]=store.getState().comMapStocState.comMapList;

        let s1:Set<string>=new Set<string>(qlst.map(a=>a.idIntern));

        let s2:Set<string>=new Set<string>(clst.map((a=>a.idIntern)));

        let r: Set<string> = new Set<string>(Array.from(s1).filter((a:string) => !s2.has(a)));

        // let r:Set<MapStocOtim>=new Set<MapStocOtim>(Array.from(s1).filter(a=>!s2.has(a)));

        // console.log(s2);
        let rezLst:MapStocOtim[]=qlst.filter(p=>r.has(p.idIntern));





        if(rezLst.length>=0){
            console.log("Size ="+rezLst.length);
            setNewObLst(rezLst)

        }

    }


    let bulkAdd=async (nLst:MapStocOtim[]|undefined):Promise<void>=>{
        let api=new Api();

        if(nLst!=undefined&&nLst.length>0){
            setSpin(1);
            let addList= nLst.map(e=>{
                let ch:MapStocOtim={
                    id:null,
                    idIntern:e.idIntern,
                    articol:e.articol,
                    grupa:e.grupa,
                    categorie:e.categorie,
                    furniz:e.furniz,
                    id_furn:e.id_furn,
                    nr_zile:e.nr_zile
                }
                return ch

            }) ;

            if(addList!=null&&addList.length>0){
                setSpin(1);
                try{

                    let respp:boolean=await api.bulkAddMapStoc(addList,myToken!);
                    console.log(respp)
                    console.log(";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;")
                    try{

                        let r=await qLoad();
                    }catch (e) {

                    }
                }catch (e) {

                }

            }else{
                console.log("Lista de sync goala");
            }

        }



    }


    let synchro=async ():Promise<void>=>{

        let lista=newObLst;
        let k=1;
        if(lista.length>100){
            while(lista.length>0){
                let pag=lista.splice(0,300);
                console.log(pag);
                await bulkAdd(pag);

            }

        }else{
            await bulkAdd(newObLst);
        }


    }


    let showGrid=()=>{
        setShowGrd(0);
        console.log("Intru cu grupul in SHOWGRID"+grupPag);
        console.log("Last De la pag:"+pst+" la pagina "+psf);
        console.log("Grp="+grupPag);
        console.log("Lista de lucru");
        console.log(wkLst);
        let nrPagini:number=Math.floor(wkLst.length/100)+1;
        let pags:number[]=[];
        for(let i=1;i<=nrPagini;i++){
            pags.push(i);
        }
        setTotPag(pags);
        setGrupPag(1);

        // setGrupPag((prevState) =>{
        //     console.log("Prevstate grp="+prevState);
        //     return prevState+1;
        //
        // });
        setShUtil(1);
        setShowGrd(1);
        setChGr(prevState => ++prevState);

    }

    let nextGrpClk=(incr:number)=>{
        console.log("Intru cu grupul "+grupPag);
        console.log("Last De la pag:"+pst+" la pagina "+psf);
        console.log("Array de paginatii ");
        console.log(totPag);
        console.log("Incrementez cu "+incr);
        let maxGrp=Math.floor(Math.floor(wkLst.length/100)+1)+1;
        console.log("Max grp="+maxGrp);
        if(grupPag>=1&&grupPag<maxGrp){
            console.log("E in interval");
            if(incr==-1&&grupPag==1){
                setChGr(prevState => prevState++);
            }else{
                setChGr(prevState => prevState++);
                setGrupPag(prevState =>prevState+incr);
            }

        }else{

            setGrupPag(1);
        }


    }

    let pgClk=(i:number)=>{
        console.log(i);
        setPgSel(i);

    }

    let refresh=()=>{

        setWkLst([]);
        setShowGrd(0);
        setGrupPag(0);
        setTotPag([]);
        setShUtil(0);
        setpst(0);
        setpsf(0);
        setPgSel(1);
        qLoad();


    }

    let filterGrupa=async (fil:string):Promise<MapStocOtim[]>=>{

        let lf:MapStocOtim[]=store.getState().comMapStocState.comMapList;
        // let a:MapStocOtim[]=structuredClone(cMapStocList);
        if(fil.length==0){
            return lf;
        }


        let listt:MapStocOtim[]= lf.filter(f=>f.grupa.includes(fil))
            .sort((a:MapStocOtim,b:MapStocOtim)=>a.grupa.localeCompare(b.grupa));

        refrPages(listt);
        return listt;

    }

    let search= (e:ChangeEvent<HTMLInputElement>):void=>{
        let srcs:string=e.currentTarget.value;
        // console.log(srcs);
        setShowGrd(0);
        setChGr(0);
        let lf:MapStocOtim[]=cMapStocList;
           let lif:MapStocOtim[]= lf.filter(a=>a.grupa.includes(srcs)||a.categorie.includes(srcs)||a.articol.includes(srcs))
                .sort((p,q)=>p.articol.localeCompare(q.articol))
                .sort((a,b)=>a.categorie.localeCompare(b.categorie))
                .sort((a,b)=>a.grupa.localeCompare(b.grupa));
        // console.log("*************** LISTA DIN SEARCH*****************")

        // console.log(lif);
        setGrupPag(1);

        setShUtil(prevState => prevState=prevState+1);
        setShowGrd(prevState => prevState=prevState+1);

        setChGr(prevState => prevState=prevState+1);
        setWkLst(lif);
    }

    let savechanges=async ():Promise<void>=>{
        let updE:MapStocOtim|null=store.getState().comMapStocState.workingMap;
        let newList:MapStocOtim[]=cMapStocList;
        let api=new Api();
        try{
            if(updE!=null){
                try{
                    let resp=await api.updMapStoc(updE,myToken!);
                    dispatch(updMapElem(updE));

                    console.log("AM UPDATATTTTTTTTTTT")
                    console.log(store.getState().comMapStocState.comMapList);
                    let indx=wkLst.map((a,index)=>{
                        if(a.id==updE?.id){
                            return index
                        }
                        return  -1;
                    }).filter(z=>z>=0)[0];
                    let lst=structuredClone(wkLst);
                    lst[indx]=updE;
                    setWkLst(lst);
                }catch (e) {

                }




            }

        }catch (e) {
                console.log("Eroare la salvare"+e );
        }

    }

    let getChangedELm=async (newArt:MapStocOtim):Promise<void>=>{
        console.log("DIN Home--");
        console.log(newArt);
        dispatch(updateMapStocWk(newArt));
        // dispatch(updMapElem(newArt));


    }


    let refrPages=(lista:MapStocOtim[])=>{
        if(lista.length>0){
            let nrPx=Math.floor(lista.length)+1;
            if(nrPx==0){
                setTotPag([1])
            }else{
                let x:number[]=[];
                for(let i=1;i<=nrPx;i++){
                    x.push(i);
                }
                setTotPag(x);
            }

        }

    }

    let delRec=()=>{
        setShMess(1);

        setShUtil(0);



    }

    let btnMsgClk= async (choose:number):Promise<void>=>{

        if(choose>=0){
            if(choose==1){
                let api=new Api();
                try{
                    let response=await api.delMapStoc(focussd!.idIntern,myToken!);
                    if(response==true&&focussd?.id!=null){

                       dispatch(delMapElement(focussd.idIntern));
                       console.log("Store cu NOUA LISTA");
                       console.log(store.getState().comMapStocState.comMapList);
                       setWkLst(store.getState().comMapStocState.comMapList);
                    }
                }catch (e) {

                }
            }
            setShMess(0);
            setShUtil(1);
        }
    }

    let selRec=(nr:number)=>{
        console.log("DIN HOME am selectat "+nr);
        console.log(wkLst[nr-1].articol);
        setFocussed(wkLst[nr-1]);

    }

    let getCrt=()=>{


    }

    function showFirstDiv() {
        const cntList=document.getElementsByClassName("serv");
        const servC=cntList[0] as HTMLElement;
        // elm2!.style.transition=' transform 2s';
        //
        // elm2!.style.transform= 'rotateY(180deg)';

        setTimeout(()=>{
            console.log("dsds");
            // const elm=document.getElementById("secondDiv");
            // const elm2=document.getElementById("firstDiv");
            //
            // const cntList=document.getElementsByClassName("serv");
            // const servC=cntList[0] as HTMLElement;
            servC!.style.display="inherit";

            setShowLogin(0);
            setShowRegister(0);

            // console.log("Hellow in showfirstdiv");
            // servC!.style.display="inherit";
            // elm2!.style.display = 'inherit';
            //
            //
            // elm!.style.display = 'none';

        },2400);

    }

    let hideThis=(nr:number):void=> {
        // const elm2=document.getElementById('secondDiv')

        // const elm1=document.getElementById('firstDiv')
        const cntList=document.getElementsByClassName("serv");
        const servC=cntList[0] as HTMLElement;
        // elm2!.style.transition=' transform 2s';
        //
        // elm2!.style.transform= 'rotateY(180deg)';

        servC!.style.display="none";

        if(nr>0){
            setShowRegister(1);


        }else if(nr==0){
            setShowLogin(1);

        }

        // elm1!.style.display = 'none';
        // elm2!.style.display = 'block';
    }

    return (
            <WrapperNewHome>
                <div className={"aside"}>
                    <div className={"commands"}>
                        <ul className="nav nav-pills">
                            <li className="nav-item">
                                <a id={"topmenu"} className="nav-link active" href="#">MicroServices</a>
                            </li>

                            <li className="nav-item qsrv">
                                {/*<a className="nav-link" href="#">Link</a>*/}
                                <div className={"divcc"}>
                                    <div className={"divff"}>
                                        <div className={"dfrontt"}>
                                            <p>Query Action</p>

                                        </div>
                                        <div className={"dbackk"}>
                                            <button type="button" className="btn btn-danger" onClick={refresh}>Refresh List</button>
                                        </div>
                                    </div>

                                </div>
                            </li>
                            <li className="nav-item dropdown">
                                <a className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button"
                                   aria-haspopup="true" aria-expanded="false">Comm Actions</a>
                                <div className="dropdown-menu">
                                    <h6 className="dropdown-header">Actions</h6>
                                    <a className="dropdown-item" href="#" onClick={synchro} >Syncronize</a>
                                    <div className="dropdown-divider"></div>

                                    <a className="dropdown-item" href="#" onClick={showGrid}>Show All Products</a>
                                    <a className="dropdown-item" href="#">Empty DB</a>
                                    {/*<a className="dropdown-item" href="#">Separated link</a>*/}
                                </div>
                            </li>

                            <li className="nav-item">
                                <a className="nav-link disabled" href="#">Disabled</a>
                            </li>


                            {
                                // authUser!=null&&authUser!=undefined?(
                                authUser!=null&&authUser!=undefined?(
                                    <>
                                        <li className="nav-item authusr">
                                            {/*<a className="nav-link disabled " >{"Authorized user:"}</a>*/}
                                            {/*<a className="nav-link disabled" >{"ion constantin nimigean"}</a>*/}
                                            <p>{"Auth user:"}</p>
                                            <p>{authUser.name}</p>

                                        </li>
                                    </>
                                ):""

                            }




                        </ul>
                    </div>




                </div>
                <div className={"main"}>

                    {
                        showLogin>0?(
                            <>
                                {/*<Login backFunction={showFirstDiv}/>*/}

                                <KeycloakLogin onCancel={()=>showFirstDiv()}/>
                            </>
                        ):""
                    }
                    {
                        showRegister>0?(
                            <>
                                <Register backFunction={showFirstDiv}/>
                            </>
                        ):""
                    }
                    {/*<Login/>*/}
                    <div className={"serv"}>
                        <div className={"divcq"}>
                            <div className={"divfq"}>
                                <div className="dfrontq">
                                    <div className="card-header">Query Service</div>
                                    <div className="card-body">
                                        <p className="card-text">Query Products DB from external source.</p>

                                    </div>
                                </div>
                                <div className="dbackq">
                                    <div className="card-header">Status Info</div>
                                    <div className="card-body">
                                        <p className="card-text">We have <span
                                            className="badge bg-primary rounded-pill" >{newObLst.length}</span> products unsynchronized
                                        </p>
                                    </div>
                                </div>

                            </div>

                        </div>
                        <div className={"divcq"}>
                            <div className={"divfq"}>
                                <div className={"dfrontq"}>
                                    <div className={"card-header"}>Command Service</div>

                                    <div className="card-body">
                                        <p className="card-text">This started some actions over an owned DB with declared purpose of
                                            exercising</p>

                                    </div>

                                    {/*<p>This started some actions over an owned DB with declared purpose of*/}
                                    {/*    exercising </p>*/}

                                </div>
                                <div className={"dbackq cmddiv"}>
                                    <div className={"card-header"}>Status Info</div>
                                    <p>Owned DB contains <span
                                        className="badge bg-primary rounded-pill">{comTotObj}</span> products</p>
                                </div>
                            </div>

                        </div>
                        {/*start login*/}
{/*--------------------------------------------------*/}
                        <div className={"divcq"}>
                            <div className={"divfq"}>
                                <div className={"dfrontql"}>
                                    <div className={"card-header"}>Login</div>

                                    <div className="card-body">
                                        <p className="card-text">This hover will start Login process for obtain Authorized profile</p>

                                    </div>

                                    {/*<p>This started some actions over an owned DB with declared purpose of*/}
                                    {/*    exercising </p>*/}

                                </div>
                                <div className={"dbackqLogin cmddiv"}>
                                    <div className={"card-header"}>Login Actions</div>
                                    <button type={"button"} className={"btn btn-success"} onClick={()=>hideThis(0)}>Login</button>

                                </div>
                            </div>

                        </div>
                        <div className={"divcq"}>
                            <div className={"divfq"}>
                                <div className={"dfrontqr"}>
                                    <div className={"card-header"}>Register</div>

                                    <div className="card-body">
                                        <p className="card-text">This hover will start Register process for obtain access to app</p>

                                    </div>


                                </div>
                                <div className={"dbackqLogin cmddiv"}>
                                    <div className={"card-header"}>Regsiter Action</div>
                                    <button type={"button"} className={"btn btn-success"} onClick={()=>hideThis(1)}>Register</button>

                                </div>
                            </div>

                        </div>

{/*                        <div className="container">*/}
{/*                            <div className="firstDiv" id="firstDiv" onMouseOver={hideThis}>*/}
{/*                                <p>Aceasta este prima imagine</p>*/}
{/*                            </div>*/}
{/*                            /!*<div className="secondDiv" id="secondDiv">*!/*/}
{/*                            /!*    <p>Aceasta este a doua imagine</p>*!/*/}
{/*                            /!*    <button value={"Buton"} onClick={showFirstDiv}/>*!/*/}

{/*                            /!*</div>*!/*/}
{/*                        </div>*/}
                    </div>
                    {/*--------------------------------------------------*/}
                    {/*login fin*/}
                    <div className={"divcontainer"}>
                        {
                            spin>0?(

                                <>
                                    {/*<img className={"imgspin"} src={spinner} alt={"My gif"}/>*/}
                                    {/*<img className={"imgspin"} src={spinimage}></img>*/}
                                    {/*<Spinner className={"spinner"} />*/}

                                    {/*<Myspin/>*/}
                                    {/*<img src={require('./spinner.gif')} alt="loading..." />*/}
                                    {/*<p>Incarc</p>*/}
                                    <img className={"imgspin"} src={spinner} alt={"My gif"}/>
                                    {/*<div className={"imgspin"} role="status">*/}
                                    {/*    <span className="sr-only">Loading...</span>*/}
                                    {/*</div>*/}
                                    {/*<img className={"imgspin"} src={myimg} alt={"My gif"}/>*/}
                                    {/*<p>Incarc.....</p>*/}
                                </>
                            ):(
                                shMess?(
                                    <>
                                        <ConfirmBox message={"You are about to delete following article: "+focussd!.articol+"??"} responseFunction={btnMsgClk}/>
                                    </>

                                ):""

                            )


                        }

                        {
                            shUtil>0?(
                                <>
                                    <div className={"divutil"}>
                                        <p>Select Search Field</p>
                                        <input className={"divsearch"} type={"text"}  onChange={(e)=>search(e)}/>

                                        <div className={"divbtns"}>

                                            <button type="button" className="btn btn-info"  onClick={delRec}><FontAwesomeIcon icon={faTrash} /></button>

                                            <MyTooltip message={"Save current Days Changes!!"} divEl={(
                                                <button type="button" className="btn btn-info" onClick={savechanges} ><FontAwesomeIcon icon={faFloppyDisk} beat /></button>
                                            )}/>
                                        </div>



                                    </div>
                                    <div className={"divtop"}>
                                        <p>Nr Crt</p>
                                        <p>Cod Articol</p>
                                        <p>Articol</p>
                                        <p>Grupa</p>
                                        <p>Categorie</p>
                                        <p>Nr zile Stoc Optim</p>


                                    </div>

                                    {
                                         wkLst?(
                                            <div className={"divgrd"}>

                                                <Grid listMap={wkLst} maxPag={40} crtPag={pgSel} crtGrp={1} selRec={getChangedELm} focusRec={selRec} prevI={0} />

                                            </div>


                                        ):""
                                    }

                                </>


                            ):""

                        }
                    </div>
                    {
                        showGrd>0&&totPag&&grupPag?(
                            <>
                                <div className={"divpag"}>
                                    <ul className="pagination">
                                        {
                                            grupPag>=1?(
                                                <>
                                                    <li className="page-item" onClick={()=>nextGrpClk((-1))}>
                                                        <a className="page-link" href="#">&laquo;</a>
                                                    </li>

                                                </>
                                            ):(
                                                <>
                                                    <li className="page-item disabled" >
                                                        <a className="page-link" href="#">&laquo;</a>
                                                    </li>

                                                </>
                                            )
                                        }
                                        {

                                            totPag.filter((p,index)=>{
                                                return p>=pst&&p<=psf;

                                            }).map(q=>{
                                                return(


                                                    <li key={q} className="page-item active" onClick={e=>pgClk(q)}>
                                                        {
                                                            pgSel==q?(
                                                                    <a className="page-link selp" href="#" >{q}</a>
                                                                ):
                                                                <a className="page-link" href="#" >{q}</a>
                                                        }

                                                    </li>

                                                )

                                            })
                                        }
                                        {
                                            psf>0&&psf<=Math.floor(wkLst.length/100)+1?(
                                                <>
                                                    <li className="page-item active">
                                                        <a className="page-link" href="#">...</a>
                                                    </li>
                                                    <li className="page-item">
                                                        <a className="page-link" href="#" onClick={()=>nextGrpClk(1)}>&raquo;</a>
                                                    </li>
                                                </>

                                            ):<>
                                                <li className="page-item disabled">
                                                    <a className="page-link" href="#" onClick={()=>nextGrpClk(1)}>&raquo;</a>
                                                </li>
                                            </>


                                        }


                                    </ul>
                                </div>


                            </>

                        ):""
                    }

                </div>
                <div className={"footeras"}>
                    <p>
                        {"Educational & Testing App"}
                    </p>
                </div>

            </WrapperNewHome>

        // </>
    )
}

export default Homes;