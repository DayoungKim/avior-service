//In opendaylight, port info can be found in the switch manager. Ports are the "node connectors".
//A port structure.

module.exports = {
	identity: 'port',

	connection: ['util'],

	attributes: {
		PortNumber: {
			type: 'string',
			required: true
		},
        HardwareAddress: {
			type: 'string',
			required: true
		},
        Name: {
			type: 'string',
			required: true
		},
        Config: {
			type: 'string',
			required: true
		},
        State: {
			type: 'string',
			required: true
		},
        CurrentFeatures: {
			type: 'string',
			required: true
		},
        AdvertisedFeatures: {
			type: 'string',
			required: true
		},
        SupportedFeatures: {
			type: 'string',
			required: true
		},
        PeerFeatures: {
			type: 'string',
			required: true
		},
        PortStats: {
			model: 'portstats',
			required: true
		},
    }
}