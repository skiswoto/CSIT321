package com.fyp2608.biov

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat

// VS04 (PRD 12.4): the prompt opens on launch and is called without a
// CryptoObject, so a successful result is only a callback (SB-02). The
// success handler then stores a plain flag on the device (SB-05).
class LaunchPromptActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val secureButton = Button(this).apply {
            text = "Open the CryptoObject screen"
            setOnClickListener {
                startActivity(Intent(this@LaunchPromptActivity, CryptoPromptActivity::class.java))
            }
        }
        setContentView(LinearLayout(this).apply { addView(secureButton) })

        showPrompt()
    }

    private fun showPrompt() {
        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                getSharedPreferences("auth", MODE_PRIVATE).edit().putBoolean("unlocked", true).apply()
                startActivity(Intent(this@LaunchPromptActivity, SecretActivity::class.java))
            }
        }
        val prompt = BiometricPrompt(this, ContextCompat.getMainExecutor(this), callback)
        val info = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock Bio-V")
            .setNegativeButtonText("Cancel")
            .build()

        // Weakness: one-argument authenticate(), no CryptoObject.
        prompt.authenticate(info)
    }
}
