import os from 'os'
import grpc from 'grpc'

// host address
const networksOrigin = os.networkInterfaces()
const networks =
    networksOrigin.eth0 ||
    networksOrigin.eth1 ||
    networksOrigin.en0 ||
    networksOrigin.en1 ||
    networksOrigin.本地连接
const address = networks.find(network => network.family === 'IPv4')

export default {
    getServerInfo() {
        return {
            ServerIp: address.address,
            ServerName: os.hostname(),
        }
    },

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
