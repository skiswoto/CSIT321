package com.fyp2608.biov

import android.os.Bundle
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.widget.Button
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

// The correct pattern, kept in Bio-V so the spike can check that the two
// authenticate() calls are told apart: the prompt opens from a button and
// unlocks a Keystore key that requires a fresh biometric. SB-02 must not
// fire here.
class CryptoPromptActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val unlockButton = Button(this).apply {
            text = "Unlock with fingerprint"
            setOnClickListener { showPrompt() }
        }
        setContentView(LinearLayout(this).apply { addView(unlockButton) })
    }

    private fun showPrompt() {
        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                // The unlocked cipher is what proves the user authenticated.
                val cipher = result.cryptoObject?.cipher ?: return
                cipher.doFinal("ok".toByteArray())
            }
        }
        val prompt = BiometricPrompt(this, ContextCompat.getMainExecutor(this), callback)
        val info = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock with a key")
            .setNegativeButtonText("Cancel")
            .build()

        val cipher = Cipher.getInstance("AES/CBC/PKCS7Padding")
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        prompt.authenticate(info, BiometricPrompt.CryptoObject(cipher))
    }

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (keyStore.getKey(KEY_NAME, null) as? SecretKey)?.let { return it }

        val spec = KeyGenParameterSpec.Builder(KEY_NAME, KeyProperties.PURPOSE_ENCRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
            .setUserAuthenticationRequired(true)
            .setInvalidatedByBiometricEnrollment(true)
            .build()
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
            .apply { init(spec) }
            .generateKey()
    }

    private companion object {
        const val KEY_NAME = "bio_v_key"
    }
}
