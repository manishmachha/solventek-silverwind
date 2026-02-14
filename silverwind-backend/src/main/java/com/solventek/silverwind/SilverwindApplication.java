package com.solventek.silverwind;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.solventek.silverwind.config.AwsProperties;
import com.solventek.silverwind.config.JwtProperties;
import com.solventek.silverwind.config.StorageProperties;

@SpringBootApplication
@EnableConfigurationProperties({ JwtProperties.class, AwsProperties.class, StorageProperties.class })
public class SilverwindApplication {

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(SilverwindApplication.class);
		app.addInitializers(ctx -> {
			String pwd = ctx.getEnvironment().getProperty("spring.datasource.password");
			System.out.println("DEBUG: Resolved spring.datasource.password: " + pwd);
			System.out.println(
					"DEBUG: Environment SPRING_DATASOURCE_PASSWORD: " + System.getenv("SPRING_DATASOURCE_PASSWORD"));
		});
		app.run(args);
	}

}
