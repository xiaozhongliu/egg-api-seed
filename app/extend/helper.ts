import grpc from 'grpc'

export default {

    getGrpcData(headers: Indexed) {
        const metadata = new grpc.Metadata();
        [
            'x-request-id',
            'x-b3-traceid',
            'x-b3-spanid',
            'x-b3-parentspanid',
            'x-b3-sampled',
            'x-b3-flags',
            'x-ot-span-context',
        ].forEach(item => {
            if (headers[item]) {
                metadata.add(item, headers[item])
            }
        })
        const service: GreeterService = this.app.grpcClient.get('main').greeter.Greeter
        return service.sayHello({ name: 'world' }, metadata)
    },
}
