package com.fyp2608.biov

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

// VS07 (PRD 12.4): the screen that should sit behind the prompt. It is
// exported in the manifest, so it can be opened directly without
// authenticating (SB-08).
class SecretActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(TextView(this).apply { text = "Secret screen" })
    }
}
