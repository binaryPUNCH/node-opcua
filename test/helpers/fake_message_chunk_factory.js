var hexDump = require("../../lib/misc/utils").hexDump;

var SecureMessageChunkManager = require("../../lib/services/secure_channel_service").SecureMessageChunkManager;
var SequenceNumberGenerator = require("../../lib/misc/sequence_number_generator").SequenceNumberGenerator;

var AsymmetricAlgorithmSecurityHeader = require("../../lib/services/secure_channel_service").AsymmetricAlgorithmSecurityHeader;

var crypto_utils = require("../../lib/misc/crypto_utils");
var path = require("path");
var folder = path.resolve(__dirname);

var senderCertificate =  crypto_utils.readCertificate(folder + "/../../certificates/client_cert.pem");
var senderPrivateKey  = crypto_utils.readKeyPem(folder + "/../../certificates/client_key.pem");

var receiverCertificate = crypto_utils.readCertificate(folder + "/../../certificates/cert.pem");
var receiverCertificateThumbprint = crypto_utils.makeSHA1Thumbprint(receiverCertificate);

/**
 * @method iterate_on_signed_message_chunks
 * @param callback {Function}
 * @param callback.err  {Error}
 * @param callback.chunks  {Array<Buffer>}
 *
 */
function iterate_on_signed_message_chunks(buffer,callback) {

    var params = {signatureLength: 128,algorithm:  "RSA-SHA1",  privateKey:senderPrivateKey };

    var options = {
        requestId: 10,
        chunkSize: 2048,
        signatureSize: 128,
        signingFunc: function(chunk) {
            return crypto_utils.makeMessageChunkSignature(chunk,params);
        }
    };

    var securityHeader = new AsymmetricAlgorithmSecurityHeader({
        securityPolicyUri: "http://opcfoundation.org/UA/SecurityPolicy#Basic128Rsa15",
        senderCertificate: senderCertificate,
        receiverCertificateThumbprint: null // null == no encryption ...receiverCertificateThumbprint
    });

    var sequenceNumberGenerator =  new SequenceNumberGenerator();

    var msgChunkManager = new SecureMessageChunkManager("OPN",options,securityHeader,sequenceNumberGenerator);


    msgChunkManager.on("chunk", function (chunk, final) {
        // full block
        callback(null,chunk);
    });

    msgChunkManager.write(buffer, buffer.length);
    msgChunkManager.end();
}
exports.iterate_on_signed_message_chunks = iterate_on_signed_message_chunks;

