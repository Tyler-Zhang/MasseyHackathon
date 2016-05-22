package net.screenoff.screenoff;

import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

public class RegisterActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        TextView tvCode = (TextView) findViewById(R.id.registerCode);
        Button bContinue = (Button) findViewById(R.id.registerButton);

        bContinue.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent intentContinue = new Intent(RegisterActivity.this, MainActivity.class);
                startActivity(intentContinue);
            }
        });
    }
}
