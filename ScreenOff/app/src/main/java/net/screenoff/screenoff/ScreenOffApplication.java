package net.screenoff.screenoff;

import android.app.Application;
import com.firebase.client.Firebase;

public class ScreenOffApplication extends Application{
    @Override
    public void onCreate() {
        super.onCreate();

        Firebase.setAndroidContext(this);
    }

}
