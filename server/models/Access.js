// Access.js

const STATUS_APPROVAL_PENDING   = 'pending';
const STATUS_APPROVAL_APPROVED  = 'approved';
const STATUS_APPROVAL_REJECTED  = 'rejected';
const VALID_APPROVAL_STATUSES   = [STATUS_APPROVAL_APPROVED, STATUS_APPROVAL_REJECTED];

const STATUS_BUTTON_IDLE        = 'idle';
const STATUS_BUTTON_CALLING     = 'calling';

const USE_CASE_CLIENT           = 'raspi';
const USE_CASE_SERVER           = 'appServer';
const VALID_USE_CASES           = [USE_CASE_CLIENT, USE_CASE_SERVER];

const BUTTON_RESET_TIMEOUT      = 10000;
const APPROVAL_RESET_TIMEOUT    = 20000;

const Config    = require('./Config');
const axios     = require('axios');

class AccessClass {
    constructor() {
        this.resetApprovalStatus(this);
        this.resetButtonStatus(this);
        
        this.appServer  = null;
        this.raspi      = null;
        
        this.buttonTimeoutHandler   = null;
        this.approvalTimeoutHandler = null;
        
        if (Config.appServer.enableCallback) {
            this.appServer = axios.create({
                baseURL: Config.appServer.triggerUrl,
                timeout: Config.appServer.requestTimeout
            });
            console.log("appServer callback enabled: " + Config.appServer.triggerUrl)
        }      

        if (Config.raspi.enableCallback) {
            this.raspi = axios.create({
                baseURL: Config.raspi.triggerUrl,
                timeout: Config.raspi.requestTimeout
            });
        }  
    }
    
    resetApprovalStatus(self) {
        self.approvalStatus = STATUS_APPROVAL_PENDING;
        console.log("State change: Approval: " + STATUS_APPROVAL_PENDING);
    }
    
    resetButtonStatus(self) {
        self.buttonStatus = STATUS_BUTTON_IDLE;
        console.log("State change: Button: " + STATUS_BUTTON_IDLE);
    }
        
    getButtonStatus(){
        return this.buttonStatus;
    }
    
    async updateButtonStatus(self) {
        this.buttonStatus = STATUS_BUTTON_CALLING;
        var result = null;
        console.log("State change: Button: " + STATUS_BUTTON_CALLING);
        
        if (this.buttonTimeoutHandler != null) {
            clearTimeout(this.buttonTimeoutHandler);
            this.buttonTimeoutHandler = null;
        }
        
        if (Config.appServer.enableCallback) {
            try {
                const response = await this.appServer.get();
                result = response.data;
            } catch (error) {
                console.error(error);
            }
        }
        
        this.buttonTimeoutHandler = setTimeout( function(){
            self.resetButtonStatus(self);
        }, BUTTON_RESET_TIMEOUT );
        
        return result;
    }
    
    getApprovalStatus() {
        return this.approvalStatus;
    }
    
    async updateApprovalStatus(value, self) {
        var result = null;
        
        if (VALID_APPROVAL_STATUSES.includes(value)) {
            this.approvalStatus = value;
            console.log("State change: Approval: " + value);
            
            if (this.approvalTimeoutHandler != null) {
                clearTimeout(this.approvalTimeoutHandler);
                this.approvalTimeoutHandler = null;
            }
        
            if (Config.raspi.enableCallback) {
                try {
                    const response = await this.raspi.get();
                    result = response.data;
                } catch (error) {
                    console.error(error);
                }
            }
            
            this.approvalTimeoutHandler = setTimeout( function(){
                self.resetApprovalStatus(self);
            }, APPROVAL_RESET_TIMEOUT );
        }
        
        return result;
    }
    
    getAuthSettings(useCase) {
        var result = true;
        if (VALID_USE_CASES.includes(useCase)) {
            if ( typeof Config[useCase].requireAuthentication != "undefined" ) {
                result = Config[useCase].requireAuthentication;
            }            
        }
        
        return { authenticationRequired: result };
    }
    
    authenticate(useCase, username, password) {
        if (VALID_USE_CASES.includes(useCase)) {
            if (typeof Config[useCase].requireAuthentication != "undefined") {
                if (!Config[useCase].requireAuthentication) {
                    return true;
                }
                if ( Config[useCase].username == username && Config[useCase].password == password) {
                    return true;
                }
            }
        }
        return false;
    }
} // class AccessClass

var Access = new AccessClass();

module.exports = Access;