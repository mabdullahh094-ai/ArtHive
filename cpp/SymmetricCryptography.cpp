#include <iostream>
#include <string>
#include <cryptopp/aes.h>
#include <cryptopp/modes.h>
#include <cryptopp/filters.h>

using namespace CryptoPP;
using namespace std;

int main() {
    string plaintext = "HelloLab123";
    string ciphertext;
    string decryptedtext;

    byte key[AES::DEFAULT_KEYLENGTH] = "0123456789abcdef"; // 16 bytes key
    byte iv[AES::BLOCKSIZE] = "abcdef9876543210";          // 16 bytes IV

    // Encrypt
    CBC_Mode<AES>::Encryption encryptor(key, sizeof(key), iv);
    StringSource(plaintext, true,
                 new StreamTransformationFilter(encryptor,
                                                new StringSink(ciphertext)));

    cout << "Encrypted text (hex): ";
    for (unsigned char c : ciphertext)
        cout << hex << (int)c;
    cout << endl;

    // Decrypt
    CBC_Mode<AES>::Decryption decryptor(key, sizeof(key), iv);
    StringSource(ciphertext, true,
                 new StreamTransformationFilter(decryptor,
                                                new StringSink(decryptedtext)));

    cout << "Decrypted text: " << decryptedtext << endl;

    return 0;
}
