var toClient = require('../../toClient.js');
var http = require('http');

/*var TO_OFP = {
	// name-in-ryu: name-in-models
};*/

// Creates a function that, when called, will make a REST API call
var restCall = function(apiMethod,apiPath){
        //var self = this;
        return function(options,cb){
                var self = this;
                optns = {method:'GET',hostname:'localhost',port:8080,path:'/stats/switches'};
                requ = http.request(optns, function(res){
                    var responseString = '';
                    res.setEncoding('utf-8');

                    res.on('data', function(data) {
                        responseString += data;
                    });
                    
                    res.on('end', function(){
                        //console.log(responseString);
                        var alldps = JSON.parse(responseString);
                        var rawPath = apiPath;     
                        if (options.args){
                                    for (arg in options.args){
                                            apiPath = apiPath.replace(/:[A-Za-z]+:/, options.args[arg]);
                                    }
                            }
                            opts = {method:apiMethod,hostname:'localhost',port:8080,path:apiPath};
                            req = http.request(opts, toClient(self,options.call,null,cb));
                            if (options.data) {
                                    req.write(JSON.stringify(options.data));
                            }
                            apiPath = rawPath;
                            req.end(); 
                    });
                      
                });
                requ.end();
        }
};

module.exports = {
	   identity: 'ryu',
    
        TO_OFP: {
            //Desc
            sw_desc: "Software",
            hw_desc: "Hardware",
            serial_num: "SerialNum",
            mfr_desc: "Manufacturer",
            
            //FlowStats
            actions: "Actions", 
            idle_timeout: "IdleTimeout", 
            cookie: "Cookie", 
            packet_count: "PacketCount", 
            hard_timeout: "HardTimeout", 
            byte_count: "ByteCount", 
            duration_nsec: "DurationNanoSeconds", 
            priority: "Priority", 
            duration_sec: "DurationSeconds", 
            table_id: "TableID", 
            match: "Match",
            dl_type: "DataLayerType", 
            nw_dst: "NetworkDestination", 
            dl_vlan_pcp: "DataLayerVLAN_PCP", 
            dl_src: "DataLayerSource", 
            tp_src: "TransportSource", 
            dl_vlan: "DataLayerVLAN", 
            nw_src: "NetworkSource", 
            nw_proto: "NetworkProtocol", 
            tp_dst: "TransportDestination", 
            dl_dst: "DataLayerDestination", 
            in_port: "InputPort",
            
            //PortStats
            tx_dropped: "TXDrops", 
            rx_packets: "RXPackets", 
            rx_crc_err: "RXCrcErr", 
            tx_bytes: "TXBytes", 
            rx_dropped: "RXDrops", 
            port_no: "PortNum", 
            rx_over_err: "RXOverrunErr", 
            rx_frame_err: "RXFrameErr", 
            rx_bytes: "RXBytes", 
            tx_errors: "TXErr", 
            collisions: "Collisions", 
            rx_errors: "RXErr", 
            tx_packets: "TXPackets",
            
            //Ports
            ports: "Ports",
            hw_addr: "HardwareAddress",
            name: "Name",
            port_no: "PortNum",
            dpid: "DPID",
            
            //Topology
            src: "Source",
            dst: "Destination",
        },

        registerConnection: function (conn, coll, cb) {
                if (!conn.port) { conn.port = 8080; }
                if (!conn.method) { conn.method = 'GET'; }
                cb();
        },
    
        teardown: function(connectionName, cb) {
          if(!sails.config.connections[connectionName]) return cb();
          delete sails.config.connections[connectionName];
          cb();
        },

        find: function (conn, coll, options, cb) {
            switch (coll){ 
                case 'switchdesc': return this.getSwitchDesc({args:[1],call:coll},cb);
                        break;
                case 'flowstats': return this.getFlowStats({args:[1],call:coll},cb);
                        break;
                case 'switchports': return this.getSwitchPorts({args:[1],call:coll},cb);
                        break; 
                case 'switch': return this.getSwitches({args:[],call:coll},cb);
                        break;
                case 'topology': return this.getTopologyLinks({args:[],call:coll},cb);
                        break;
                //case 'flow': return this.getFlows({args:['all'],call:coll},cb);
                        //break;
		        default: return cb();
                        break;
                }
        },
    
        
        create: function (conn, coll, options, cb) {
                switch (coll){
                case 'flow': return this.postFlow({data:{}},cb);
		        default: return cb();
                }
        },
    
        update: function (conn, coll, options, cb) {
                switch (coll){
		        default: return cb();
                }
        },
    
        destroy: function (conn, coll, options, cb) {
                switch (coll){
                case 'flow': return this.delFlow({data:{}},cb);
                        break;
		        default: return cb();
                }
        },
    
        normalize: function (obj) {
                var normalizedField;
                var normalizedObj;
                if (!obj){ return 0; } //to fix: this applies to both "null" and "0" responses.
		        if (obj.constructor === Array) {
			         normalizedObj = [];
			         for (i in obj) {
				        normalizedObj.push(this.normalize(obj[i]))
			         }
		        } else if (obj.constructor === String || obj.constructor === Number || obj.constructor === Boolean || obj === 0) {
                        normalizedObj = obj;
		        } else {
			         normalizedObj = {};
			         for (fromField in this.TO_OFP) {
				        if (obj[fromField] || obj[fromField] === 0) { //added so that "0" responses are not discarded
		 	        	       toField = this.TO_OFP[fromField];
	                           normalizedObj[toField] = this.normalize(obj[fromField]); //Nested structs? Probably handled recursively
				        }
			         }
                }
                return normalizedObj;
        },
    
        dpParse: function (current, obj) {
                
                arr = [];
            
                return obj;
        
        
        },
  
    //getFlows: restCall('GET',''), 
    
    getSwitchDesc: restCall('GET','/stats/desc/:arg:'), 
    
    getFlowStats: restCall('GET','/stats/flow/:arg:'), 
    
    getSwitchPorts: restCall('GET','/stats/port/:arg:'), 

    getSwitches: restCall('GET','/v1.0/topology/switches'), 
    
    getTopologyLinks: restCall('GET','/v1.0/topology/links'), 

}