export default {

    loaderOption: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    },

    clients: [
        {
            name: 'main',
            protoPath: 'app/proto/main',
            host: '0.0.0.0',
            port: 50051,
        },
    ],
}
