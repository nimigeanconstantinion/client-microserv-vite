import styled from "styled-components";


export const WrapperRowStyle=styled.div.attrs({className:"divRow"})`

  width: 100%;
  height: 40px;
  font-size:.9em;
  white-space: nowrap;
  padding:6px 0px;
  display: grid;
  grid-template-columns: 80px 150px minmax(400px, 1fr) 150px 150px 145px;
  grid-row-gap: 6px;
  grid-column-gap: 6px;
  position: relative;
  
  div .divrow{
    width:100%;
  }
  
  
  
  p.itart,p.itnr{
    width:100%;
    background-color: #5d6166;
    line-height: 20px;
    height: auto;
    margin: 0px auto;
    text-align: left;
    padding:6px 7px 6px;
  }
  p.itnr{
    text-align: right;
  }
  input.itid,input.itid,input.itgrp,input.itctg,input.itnrz{
    width:100%;
    height:100%;
    color:white;
    background-color: #5d6166;
    padding: 0px 0px 6px 5px;
    border: none;
  }
  p.itart.even,p.itnr.even,input.itid.even,input.itgrp.even,input.itctg.even,input.itnrz.even{
    color: #82322f;
    background-color:wheat;
  }
  
  .itnr.seldel{
    background-color: #42BC9B;
  }
  .itnr.even.seldel{
    background-color: #42BC9B !important;
    
  }

  input.itnrz{
    text-align:right;
    padding-right: 7px;
  }
  
  
  input.itgrp{
    width: 100%;
    margin:0px;
  }
  
  //.row{
//  background-color: #5d6166;
//  //margin: 3px 2px;
//  margin: 0px;
//  padding: 0px;
//  width: 100%;
//  height: 100%;
//} 
//  
//  
// .row{
//   background: #5d6166;;
// }
//  //.row.crt,.row.idi,.row.den,.row.grp,.row.ctg,row.nrz{
//  //  width:100%;
//  //}
//
//  
//  .row.crt. p .pc{
//    width:100%;
//  }
//  
//  input.divtx,input.divgrp{
//    border:none;
//  }
//  
//  div.row.den.even{
//    background-color:wheat !important;
//
//  }
//  input.divtx.even,p.pc.even,p.divpp.even{
//      color:brown;
//      background-color:wheat !important;   
//  }
//  
//  .row.crt p .even{
//    color:brown;
//    background-color:wheat;
//  }
//  
//////  
//  .row p {
//    height: 100%;
//    width: 100%;
//    padding: 7px 5px;
//    margin: 0px 0px;   
//    text-align: right;
//    line-height:20px;
//    background: #5d6166;
//  }
//  
//  input.divgrp{
//    width:100%;
//    margin:0px;
//    padding:0px;
//  }
//  
////  
////  
////  
////  div .divrow. p{
////    width:100%;
////    
////  }
////  input.divtx{
////    width:100%;
////  }
//  div.row.den{
//    width:100% !important;
//  }
//  div .row.den p{
//    width:100%;
//    margin-left:5px ;
//    text-align: left;
//    padding:0px;
//  }
//  
  
  //.row.den p{
  //  width:auto;
  //}
  
//
//  .row.crt p{
//    line-height: 20px;
//    padding-top: 11%;
//    text-align: right;
//  }
//  .row.idi,.row.grp,.row.ctg,.row.nrz{
//    text-align: left;
//    height: 80%;
//    width: 100%;
//    white-space: nowrap;
//  }
//  
//  .row.den p{
//    width: 100%;
//    height: 80%;
//    margin-top: 6px;
//    text-align: left;
//  }
//
//  
//.even{
//  color:brown;
//  background-color:wheat;
//}
//  .divtx,.divctg,.divgrp,.divopt{
//    background-color: #5d6166;
//    color: white;
//    height: 100%;
//    width: 100%;
//    
//  }
// .row.idi input[type="text"]{
//    height: 100%;
//    border: none;
//  }
//  .row.grp input[type="text"],.row.ctg input[type="text"]{
//    height: 100%;
//    width:100%;
//    border: none;
//  } 
//
//  //.divtx.even{
//  //  color:brown;
//  //  background-color:wheat;
//  //}
//
//  .divopt.even , .divtx.even, .divctg.even,.divgrp.even{
//    color:brown;
//    background-color:wheat;
//  }
//  
//  
//  
//  .row.den p{
//    width:100%;
//  }
//  
//  .row.den {
//    height: 80%;
//    //width: 100%;
//  }
//  
//  .row.nrz input[type="text"]{
//    height: 100%;
//    border: none;
//    text-align: right;
//  }
//  

  
  
`