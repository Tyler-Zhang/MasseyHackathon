package net.screenoff.screenoff;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;

public class JoinActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_join);

        EditText etCode = (EditText) findViewById(R.id.joinCode);
        Button bJoin = (Button) findViewById(R.id.joinButton);
    }
}
