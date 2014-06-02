var express = require('express');
var app = express.createServer(); //express(); // should be the latter for Express 3+
var http = require('http');
var OFP = require('./ofp.js'); //v1.0.0
var normalizer = '';

app.use(express.bodyParser()); // TODO bodyParser has security flaw? maybe use a different middleware here
//express.json() 

//this is in the controller object?
var toClient = function (ctlr) {
	return function (res) {
		var responseString = '';
		res.setEncoding('utf-8');
 
		res.on('data', function(data) {
			responseString += data;
		});
 
		res.on('end', function() {
                var responseObject = JSON.parse(responseString);
                var normalizedObject = ctlr.normalize(responseObject);
                console.log(normalizedObject);
                ctlr.response.send(normalizedObject);
		});
	}
}
//TODO: iterate on multiple switches. using #2 as a tester. what if multiple flows or matches or actions?
//TODO: consider readable column names as properties
//TODO: what to do with attributes that are not openflow, but floodlight? i.e. masklens
//Accessing structs: reset normalize, then call this.normalize i.e. for flow and match nested structs. This allows
//for more reuse.
//ADAPTERS
var FLAdapter = {
//	hostname: 'localhost',
	normalize: function (obj) {
        if(normalizer === "PortStats"){
            var Port = new OFP.PortStats();
            var aPort = obj["00:00:00:00:00:00:00:02"][0];
            Port.port_no = aPort.portNumber;
            Port.rx_packets = aPort.receivePackets;
            Port.tx_packets = aPort.transmitPackets;
            Port.rx_bytes = aPort.receiveBytes;
            Port.tx_bytes = aPort.transmitBytes;
            Port.rx_dropped = aPort.receiveDropped;
            Port.tx_dropped = aPort.transmitDropped;
            Port.rx_errors = aPort.receiveErrors;
            Port.tx_errors = aPort.transmitErrors;
            Port.rx_frame_err = aPort.receiveFrameErrors;
            Port.rx_over_err = aPort.receiveOverrunErrors;
            Port.rx_crc_err = aPort.receiveCRCErrors;
            Port.collisions = aPort.collisions;
            return Port;
        }
        else if(normalizer === "QueueStats"){
            //TODO: test a queue struct
        }
        else if(normalizer === "FlowStats"){
            var Flow = new OFP.FlowStats();
            var aFlow = obj["00:00:00:00:00:00:00:02"][0];
            Flow.table_id = aFlow.tableId;
                normalizer = "Match";
                Flow.match = this.normalize(aFlow.match);
            Flow.duration_sec = aFlow.durationSeconds;
            Flow.duration_nsec = aFlow.durationNanoseconds;
            Flow.priority = aFlow.priority;
            Flow.idle_timeout = aFlow.idleTimeout;
            Flow.hard_timeout = aFlow.hardTimeout;
            Flow.cookie = aFlow.cookie;
            Flow.packet_count = aFlow.packetCount;
            Flow.byte_count = aFlow.byteCount;
                normalizer = "Action";
                Flow.actions = this.normalize(aFlow.actions);
            return Flow;
        }
        else if(normalizer === "Match"){
            var Match = new OFP.Match();
            var aMatch = obj;
            Match.wildcards = aMatch.wildcards;
            Match.in_port = aMatch.inputPort;
            Match.dl_src = aMatch.dataLayerSource;
            Match.dl_dst = aMatch.dataLayerDestination;
            Match.dl_vlan = aMatch.dataLayerVirtualLan;
            Match.dl_vlan_pcp = aMatch.dataLayerVirtualLanPriorityCodePoint;
            Match.dl_type = aMatch.dataLayerType;
            Match.nw_tos = aMatch.networkTypeOfService;
            Match.nw_proto = aMatch.networkProtocol;
            Match.nw_src = aMatch.networkSource;
            Match.nw_dst = aMatch.networkDestination;
            Match.tp_src = aMatch.transportSource;
            Match.tp_dst = aMatch.transportDestination;
            //Match.nw_dst_ml = aMatch.networkDestinationMaskLen;
            //Match.nw_src_ml = aMatch.networkSourceMaskLen;
            return Match;
        }
        else if(normalizer === "Action"){
            //only OUTPUT seems to be supported
            var Action = new OFP.Action(null);
            var anAction = obj[0];
            Action.type = anAction.type;
                //length
            Action.port = anAction.port;
                //maxLength
                //lengthU
            return Action;
        }
        else if(normalizer === "AggregateStats"){
            var Aggregate = new OFP.AggregateStats();
            var anAggregateStats = obj["00:00:00:00:00:00:00:02"][0];
            Aggregate.packet_count = anAggregateStats.packetCount;
            Aggregate.byte_count = anAggregateStats.byteCount;
            Aggregate.flow_count = anAggregateStats.flowCount;
            return Aggregate;
        }
        else if(normalizer === "DescStats"){
            var Desc = new OFP.DescStats();
            var aDescStats = obj["00:00:00:00:00:00:00:02"][0];
            Desc.mfr_desc = aDescStats.manufacturerDescription;
            Desc.hw_desc = aDescStats.hardwareDescription;
            Desc.sw_desc = aDescStats.softwareDescription;
            Desc.serial_num = aDescStats.serialNumber;
            Desc.dp_desc = aDescStats.datapathDescription;
            return Desc;
        }
        else if(normalizer === "TableStats"){
            var Table = new OFP.TableStats();
            var aTableStats = obj["00:00:00:00:00:00:00:02"][0];
            Table.table_id = aTableStats.tableId;
            Table.name = aTableStats.name;
            Table.wildcards = aTableStats.wildcards;
            Table.max_entries = aTableStats.maximumEntries;
            Table.active_count = aTableStats.activeCount;
            Table.lookup_count = aTableStats.lookupCount;
            Table.matched_count = aTableStats.matchedCount;
            //length
        }
        else if(normalizer === "Features"){
            var Features = new OFP.SwitchFeatures();
            var aFeatures = obj["00:00:00:00:00:00:00:02"];
            Features.datapath_id = aFeatures.datapathId;
            Features.n_buffers = aFeatures.buffers;
            Features.n_tables = aFeatures.tables;
            Features.capabilities = aFeatures.capabilities;
            Features.actions = aFeatures.actions;
                normalizer = "PortFeatures";
                Features.ports = this.normalize(aFeatures.ports);
                //length
                //type
                //version
                //xid
        }
        else if(normalizer === "PortFeatures"){
            var PortFeatures = new OFP.Port();
            var aPortFeatures = obj[0];
            PortFeatures.name = aPortFeatures.name;
            PortFeatures.hw_addr = aPortFeatures.hardwareAddress;
            PortFeatures.port_no = aPortFeatures.portNumber;
            PortFeatures.config = aPortFeatures.config;
            PortFeatures.state = aPortFeatures.state;
            PortFeatures.curr = aPortFeatures.currentFeatures;
            PortFeatures.advertised = aPortFeatures.advertisedFeatures;
            PortFeatures.supported = aPortFeatures.supportedFeatures;
            PortFeatures.peer = aPortFeatures.peerFeatures;
            return PortFeatures;
        }
        else if(normalizer === "Switches"){
            //some objects are not ofp and they don't exist yet, this is one of them
            var Switch = new Switch();
            var aSwitch = obj[1];
            Switch.role =  aSwitch.harole;
                normalizer = "PortFeatures";
                Switch.ports = this.normalize(aSwitch.ports);
            Switch.n_buffers = aSwitch.buffers;
                normalizer = "SwitchDesc";
                Switch.desc = this.normalize(aSwitch.description);
            Switch.capabilities = aSwitch.capabilities;
            Switch.inet_address = aSwitch.inetAddress;
            Switch.connected_since = aSwitch.connectedSince;
            Switch.datapath_id = aSwitch.dpid;
            Switch.actions = aSwitch.actions;
                normalizer = "SwitchAttributes";
                Switch.attributes = this.normalize(aSwitch.attributes);
        }
        else if(normalizer === "SwitchDesc"){
            var SwitchDesc = new OFP.DescStats();
            var aSwitchDesc = obj;
            SwitchDesc.mfr_desc = aSwitchDesc.manufacturer;
            SwitchDesc.hw_desc = aSwitchDesc.hardware;
            SwitchDesc.sw_desc = aSwitchDesc.software;
            SwitchDesc.serial_num = aSwitchDesc.serialNum;
            SwitchDesc.dp_desc = aSwitchDesc.datapath;
            return SwitchDesc;
        }
        else if(normalizer === "SwitchAttributes"){
            var SwitchAttributes = new SwitchAttributes();
            var aSwitchAttributes = obj;
            SwitchAttributes.supports_ofpp_flood = aSwitchAttributes.supportsOfppFlood;
            SwitchAttributes.supports_nx_role = aSwitchAttributes.supportsNxRole;
            SwitchAttributes.fast_wildcards = aSwitchAttributes.FastWildcards;
            SwitchAttributes.supports_ofpp_table = aSwitchAttributes.supportsOfppTable;
            return SwitchAttributes;
        }
        else if(normalizer === "Summary"){
            var Summary = new ControllerSummary();
            var aSummary = obj;
            Summary.n_switches = obj["# Switches"];
            Summary.n_hosts = obj["# hosts"];
            Summary.n_quarantine_ports = obj["# quarantine ports"];
            Summary.n_inter_switch_links = obj["# inter-switch links"];
            return Summary;
        }
        else if(normalizer === "Memory"){
            var Memory = new Memory();
            Memory.total = obj.total;
            Memory.free = obj.free;
            return Memory;
        }
        else if(normalizer === "Health"){
            var Health = new Health();
            Health.healthy = obj.healthy;
            return Health;
        }
        else if(normalizer === "Uptime"){
            var Uptime = new Uptime();
            Uptime.system_uptime_msec = obj.systemUptimeMsec;
            return Uptime;
        }
        else if(normalizer === "TopologyLinks"){
            var TopologyLinks = new TopologyLinks();
            var aLink = obj[0];
            TopologyLinks["src-switch"] = aLink["src-switch"];
            TopologyLinks["src-port"] = aLink["src-port"];
            TopologyLinks["dst-switch"] = aLink["dst-switch"];
            TopologyLinks["dst-port"] = aLink["dst-port"];
            TopologyLinks.type = aLink.type;
            TopologyLinks.direction = aLink.direction;
            return TopologyLinks;
        }
        else if(normalizer === "TopologyClusters"){
            var TopologyCluster = new TopologyCluster();
            var aCluster = obj["00:00:00:00:00:00:00:02"];
            TopologyCluster.dpid = aCluster;
            return TopologyCluster;
        }
        else if(normalizer === "TopologyExternalLinks"){
            //empty for now until tested
        }
        else if(normalizer === "Hosts"){
            //returns empty array even with hosts present, fl rest api page says:
            //Passed as GET parameters: mac (colon-separated hex-encoded), ipv4 (dotted decimal), vlan, dpid attachment point DPID (colon-separated hex-encoded) and port the           attachment point port. 
        }
        else{
            return {};
        }
	},
	getPortStats: function(id) {
		var self = this;
		if (!id) { id = 'all'; }
        normalizer = "PortStats";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/core/switch/'+id+'/port/json'}, toClient(self));
        req.end();
	},
    getQueueStats: function(id) {
		var self = this;
		if (!id) { id = 'all'; }
        normalizer = "QueueStats";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/core/switch/'+id+'/queue/json'}, toClient(self));
        req.end();
	},
    getFlowStats: function(id) {
		var self = this;
		if (!id) { id = 'all'; }
        normalizer = "FlowStats";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/core/switch/'+id+'/flow/json'}, toClient(self));
        req.end();
	},
    getAggregateStats: function(id) {
		var self = this;
		if (!id) { id = 'all'; }
        normalizer = "AggregateStats";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/core/switch/'+id+'/aggregate/json'}, toClient(self));
        req.end();
	},
    getDescStats: function(id) {
		var self = this;
		if (!id) { id = 'all'; }
        normalizer = "DescStats";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/core/switch/'+id+'/desc/json'}, toClient(self));
        req.end();
	},
    getTableStats: function(id) {
		var self = this;
		if (!id) { id = 'all'; }
        normalizer = "TableStats";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/core/switch/'+id+'/table/json'}, toClient(self));
        req.end();
	},
    getFeatures: function(id) {
		var self = this;
		if (!id) { id = 'all'; }
        normalizer = "Features";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/core/switch/'+id+'/features/json'}, toClient(self));
        req.end();
	},
    getSwitches: function(id) {
		var self = this;
        normalizer = "Switches";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/core/controller/switches/json'}, toClient(self));
        req.end();
	},
    getSummary: function(id) {
		var self = this;
        normalizer = "Summary";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/core/controller/summary/json'}, toClient(self));
        req.end();
	},
    getCounters: function(id) {
		var self = this;
		if (!counter) { counter = 'all'; }
        if (id) { id = ''+id+'/'; }
        if (!id) { id = '' }
        normalizer = "Counters";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/core/counter/'+id+''+counter+'/json'}, toClient(self));
        req.end();
	},
    getMemory: function(id) {
		var self = this;
        normalizer = "Memory";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/core/memory/json'}, toClient(self));
        req.end();
	},
    getHealth: function(id) {
		var self = this;
        normalizer = "Health";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/core/health/json'}, toClient(self));
        req.end();
	},
    getUptime: function(id) {
		var self = this;
        normalizer = "Uptime";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/core/system/uptime/json'}, toClient(self));
        req.end();
	},
    getTopologyLinks: function(id) {
		var self = this;
        normalizer = "TopologyLinks";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/topology/links/json'}, toClient(self));
        req.end();
	},
    getTopologyClusters: function(id) {
		var self = this;
        normalizer = "TopologyClusters";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/topology/switchclusters/json'}, toClient(self));
        req.end();
	},
    getTopologyExternalLinks: function(id) {
		var self = this;
        normalizer = "TopologyExternalLinks";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/topology/external-links/json'}, toClient(self));
        req.end();
	},
    getHosts: function(id) {
		var self = this;
        normalizer = "Hosts";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/device/'}, toClient(self));
        req.end();
	},
    postFlow: function(flow) {
		var self = this;
        normalizer = "PostFlow";
		req = http.request({method:'POST',hostname:this.hostname,port:8080,path:'/wm/staticflowentrypusher/json'}, toClient(self));
        flow = JSON.stringify(flow);
        req.write(flow);
        req.end();
	},
    delFlow: function(id) {
		var self = this;
        normalizer = "DelFlow";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/staticflowentrypusher/json'}, toClient(self));
        req.end();
	},
    getFlows: function(id) {
		var self = this;
        if (!id) { id = 'all'; }
        normalizer = "ListFlows";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/staticflowentrypusher/list/'+id+'/json'}, toClient(self));
        req.end();
	},
    clearFlows: function(id) {
		var self = this;
        if (!id) { id = 'all'; }
        normalizer = "ClearFlows";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/staticflowentrypusher/clear/'+id+'/json'}, toClient(self));
        req.end();
	},
    ////////////////////////////////////////////////////////////////////PLACEHOLDER FOR VIRTUAL NETWORK CALLS
    getFirewallStatus: function(id) {
		var self = this;
        normalizer = "FirewallStatus";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/firewall/module/status/json'}, toClient(self));
        req.end();
	},
    enableFirewall: function(id) {
		var self = this;
        normalizer = "EnableFirewall";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/firewall/module/enable/json'}, toClient(self));
        req.end();
	},
    disableFirewall: function(id) {
		var self = this;
        normalizer = "DisableFirewall";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/firewall/module/disable/json'}, toClient(self));
        req.end();
	},
    getFirewallStorageRules: function(id) {
		var self = this;
        normalizer = "FirewallStorageRules";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/firewall/module/storageRules/json'}, toClient(self));
        req.end();
	},
    getFirewallSubnetMask: function(id) {
		var self = this;
        normalizer = "FirewallSubnetMask";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/firewall/module/subnet-mask/json'}, toClient(self));
        req.end();
	},
    getFirewallRules: function(id) {
		var self = this;
        normalizer = "FirewallRules";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/firewall/rules/json'}, toClient(self));
        req.end();
	},
    postFirewallRule: function(id) {
		var self = this;
        normalizer = "PostFirewallRule";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/firewall/rules/json'}, toClient(self));
        req.end();
	},
    deleteFirewallRule: function(id) {
		var self = this;
        normalizer = "DelFirewallRule";
		req = http.request({hostname:this.hostname,port:8080,path:'/wm/firewall/rules/json'}, toClient(self));
        req.end();
	}
}

var ODLAdapter = {
//    hostname: 'localhost',
	normalize: function (obj) {
        var aPort = obj["portStatistics"][0]["portStatistic"][0];
        console.log(aPort);
        Port.port_no = obj["portStatistics"][0]["portStatistic"][0]["nodeConnector"].id;
        Port.rx_packets = aPort.receivePackets;
        Port.tx_packets = aPort.transmitPackets;
        Port.rx_bytes = aPort.receiveBytes;
        Port.tx_bytes = aPort.transmitBytes;
        Port.rx_dropped = aPort.receiveDrops;
        Port.tx_dropped = aPort.transmitDrops;
        Port.rx_errors = aPort.receiveErrors;
        Port.tx_errors = aPort.transmitErrors;
        Port.rx_frame_err = aPort.receiveFrameError;
        Port.rx_over_err = aPort.receiveOverRunError;
        Port.rx_crc_err = aPort.receiveCrcError;
        Port.collisions = aPort.collisionCount;
		return Port;
	},
	getPortStats: function(id) {
		var self = this;
		http.get({hostname:this.hostname,port:8080,path:'/controller/nb/v2/statistics/default/port',auth:'admin:admin'}, toClient(self));
	},
    postFlow: function(id, flow) {
		var self = this;
        normalizer = "PostFlow";
		req = http.request({method:'POST',hostname:this.hostname,port:8080,path:'',auth:'admin:admin'}, toClient(self));
        req.write(flow);
        req.end();
	},
}

/*
function ODLAdapter(options) {
    this.hostname = options.hostname ? options.hostname : "localhost";
    this.port = options.port ? options.port : "8080";
    this.username = username;
    this.passwd = passwd;
}
ODLAdapter.prototype.normalize = function (obj) {
    var aPort = obj["portStatistics"][0]["portStatistic"][0];
    console.log(aPort);
    Port.port_no = obj["portStatistics"][0]["portStatistic"][0]["nodeConnector"].id;
    Port.rx_packets = aPort.receivePackets;
    Port.tx_packets = aPort.transmitPackets;
    Port.rx_bytes = aPort.receiveBytes;
    Port.tx_bytes = aPort.transmitBytes;
    Port.rx_dropped = aPort.receiveDrops;
    Port.tx_dropped = aPort.transmitDrops;
    Port.rx_errors = aPort.receiveErrors;
    Port.tx_errors = aPort.transmitErrors;
    Port.rx_frame_err = aPort.receiveFrameError;
    Port.rx_over_err = aPort.receiveOverRunError;
    Port.rx_crc_err = aPort.receiveCrcError;
    Port.collisions = aPort.collisionCount;
	return Port;
};
ODLAdapter.prototype.getPortStats = function(id) {
	var self = this;
	http.get({hostname:this.hostname,port:8080,path:'/controller/nb/v2/statistics/default/port',auth:'admin:admin'}, toClient(self));
}
*/

var CONTROLLERS = {
    Floodlight: FLAdapter,
    OpenDaylight: ODLAdapter
};

//app.controller = ODLAdapter;
//this needs to be set via post. check for controller?

//COURIER 

//Test routes
app.get('/core/ports', function(req,res){
	app.controller.response = res;
	app.controller.getPortStats(); // empty id defaults to 'all' switches
});

app.get('/core/aggregate', function(req,res){
	app.controller.response = res;
	app.controller.getAggregateStats(); // empty id defaults to 'all' switches
});

app.get('/core/flows', function(req,res){
	app.controller.response = res;
    app.controller.getFlowStats(); // empty id defaults to 'all' switches
});

app.get('/core/desc', function(req,res){
	app.controller.response = res;
    app.controller.getDescStats(); // empty id defaults to 'all' switches
});

app.get('/core/table', function(req,res){
	app.controller.response = res;
    app.controller.getTableStats(); // empty id defaults to 'all' switches
});

app.get('/core/features', function(req,res){
	app.controller.response = res;
    app.controller.getFeatures(); // empty id defaults to 'all' switches
});

app.get('/core/switches', function(req,res){
	app.controller.response = res;
    app.controller.getSwitches(); // empty id defaults to 'all' switches
});

app.get('/core/controller/summary', function(req,res){
	app.controller.response = res;
    app.controller.getSummary(); // empty id defaults to 'all' switches
});

app.post('/flow', function(req,res){
    app.controller.postFlow(req.body);
    res.send("\nFlow sent\n");
});

//Main routes
app.get('/controller/list', function(req,res){
	app.controller.response = res;
});

app.get('/controller/:id', function(req,res){
	app.controller.response = res;
});

//app.post('/controller', function(req,res){
	//app.controller.response = res;
//});

app.del('/controller/:id', function(req,res){
	app.controller.response = res;
});

app.get('/core/switch/summary/:dpid', function(req,res){
	app.controller.response = res;
});

app.get('/core/switch/detail/:dpid', function(req,res){
	app.controller.response = res;
});

app.get('/flows', function(req,res){
	app.controller.response = res;
});

app.get('/flows/static', function(req,res){
	app.controller.response = res;
});

app.post('/flow/mod', function(req,res){
	app.controller.response = res;
});

app.del('/flow/mod/:name', function(req,res){
	app.controller.response = res;
});

app.get('/firewall/status', function(req,res){
	app.controller.response = res;
});

app.post('/firewall/status', function(req,res){
	app.controller.response = res;
});

app.get('/firewall/rules', function(req,res){
	app.controller.response = res;
});

app.post('/firewall/rule', function(req,res){
	app.controller.response = res;
});

app.put('/firewall/rule/:id', function(req,res){
	app.controller.response = res;
});

app.del('/firewall/rule/:id', function(req,res){
	app.controller.response = res;
});

app.post('/controller', function(req,res){
    //var ControllerType = CONTROLLERS[req.body.type];
    //app.controller = new ControllerType();
    app.controller = CONTROLLERS[req.body.type];
    if (app.controller) {
        app.controller.hostname = req.body.hostname;
        res.send("\nController set\n");
        //app.controller.response = res;
        //app.controller.response.send({"type":"Floodlight", "hostname":"localhost", "port":8080});
    }
});

//type and ip of controller is provided

//SERVER
app.listen(process.env.PORT || 3412);
//run on 8080