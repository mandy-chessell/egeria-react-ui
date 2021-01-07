/* SPDX-License-Identifier: Apache-2.0 */
/* Copyright Contributors to the ODPi Egeria project. */


import React, { createContext, useContext }           from "react";

import PropTypes                                      from "prop-types";

import { IdentificationContext }                      from "../../../contexts/IdentificationContext";




export const RequestContext = createContext();

export const RequestContextConsumer = RequestContext.Consumer;

/*
 * The request context will issue a request to a remote resource (a platform or server)
 * The name of the resource is passed in, together with the URI that indicates the operation
 * being requested.
 * The request context delegates to the identification context and ultimately to the view-service 
 * to issue the requested query against the specified resource.
 */


const RequestContextProvider = (props) => {

  
  const identificationContext = useContext(IdentificationContext);
  
  

  /*
   * Define the basic body parameters that are common to requests to the platform or server
   * resourceCategory is either "platform" or "server-instance"
   */
 
  const buildBaseBody = (resourceCategory, resourceName) => {
    
    if (!resourceName) {
      alert("No resource name was specified - please specify one and retry");
      return null;
    }
    if (!resourceCategory) {
      alert("No resource category was specified - please specify one and retry");
      return null;
    }
    if (resourceCategory === "platform" ) {
      const base = {
        platformName    : resourceName};
      return base;
    }
    else if (resourceCategory === "server-instance") {
      const base = {
        serverName      : resourceName};
      return base;
    }
    else if (resourceCategory === "service-instance") {
      const base = {
        serviceName     : resourceName};
      return base;
    }
    else {
      alert("The resource category was neither server-instance nor platform - please retry");
      return null;
    }
      
  };

  /*
   * This method wil POST to the view service appending the supplied URI to a multi-tenant URL.
   * It should be called with the tail portion of the URI, the operation-specific body parameters and 
   * an operation-specific callback function.
   * 
   * The caller needs to specfiy the platform by platformName - the platformRootURL will be resolved
   * by the view service.
   */ 
  const callPOST = (resourceCategory, resourceName, uri, bodyParms, callback) => {

    if (identificationContext.userId === "") {
      alert("There is no user context, please login to the UI");
      return;
    }
    if (!resourceName) {
      alert("No resource name was specified - please specify one and retry");
      return null;
    }
    if (!resourceCategory) {
      alert("No resource category was specified - please specify one and retry");
      return null;
    }
    
    const url = identificationContext.getRestURL("dino") + "/" + uri;
    
    /* 
     * Add any (optional) bodyParms to the baseBody
     */
    const body = Object.assign(buildBaseBody(resourceCategory, resourceName), bodyParms);

    if (body !== null) {

      fetch(url, {
        method     : "POST",
        headers    : { Accept: "application/json", "Content-Type": "application/json" },
        body       : JSON.stringify(body)
      })         

      /*
       * The response from fetch() should always:
       * either:
       *  - be ok and comtain a JSON body, which is retrieved using json(),
       * or:
       *  - be !ok and contain status, statusText and a text body, which is retrieved using text().
       * In either case, this function will call the callback with a JSON object.
       *
       * The relatedHTTPCode (200, 400, etc.) should be checked in the callback,
       * where there is contextual information about the operation that was performed
       * and where more specific error context can be supplied in the message to the
       * user.
       */

      .then(response => {
        if (response.ok) {
          response.json()
          .then(json => {
            /*
             * No need to check status code here - leave it to the callback which knows the operation context.
             */
            callback(json)
          });
        }
        else {
          /*
           * response was not 'ok'. Parse the status fields and body text and contruct
           * a json response to pass to the callback...
           */
          let json = {};
          json.relatedHTTPCode = response.status;
          json.requestURL      = response.url;
          response.text() // returns a promise...
          .then(text => {
            json.exceptionErrorMessage = text;
            callback(json);
          })
        }
      })
    }
  };


  /* 
   * This method wil GET from the view service appending the supplied URI to a multi-tenant URL.
   * It should be called with the tail portion of the URI. This is only used for a light-weight 
   * GET operations and there are no operation-specific body parameters. These could be added if
   * needed.
   * The caller must specify an operation-specific callback function.
   */ 
  const callGET = (uri, callback) => {
  
    if (identificationContext.userId === "") {
      alert("There is no user context, please login to the UI");
      return;
    }
      
    const url = identificationContext.getRestURL("dino") + "/" + uri;
  
    /* 
     * No body needed
     */
         
    fetch(url, {
      method     : "GET",
      headers    : { Accept: "application/json", "Content-Type": "application/json" },
    })         

    /*
     * The response from fetch() should always:
     * either:
     *  - be ok and comtain a JSON body, which is retrieved using json(),
     * or:
     *  - be !ok and contain status, statusText and a text body, which is retrieved using text().
     * In either case, this function will call the callback with a JSON object.
     *
     * The relatedHTTPCode (200, 400, etc.) should be checked in the callback,
     * where there is contextual information about the operation that was performed
     * and where more specific error context can be supplied in the message to the
     * user.
     */

    .then(response => {
      if (response.ok) {
        response.json()
        .then(json => {
          /*
           * No need to check status code here - leave it to the callback which knows the operation context.
           */
          callback(json)
        });
      }
      else {
        /*
         * response was not 'ok'. Parse the status fields and body text and contruct
         * a json response to pass to the callback...
         */
        let json = {};
        json.relatedHTTPCode = response.status;
        json.requestURL      = response.url;
        response.text() // returns a promise...
        .then(text => {
          json.exceptionErrorMessage = text;
          callback(json);
        })
      }
    })
  };


  return (
    <RequestContext.Provider
      value={{
        callPOST,
        callGET,
        buildBaseBody
      }}
    >      
    {props.children}
    </RequestContext.Provider>
  );
};

RequestContextProvider.propTypes = {
  children: PropTypes.node  
};

export default RequestContextProvider;
