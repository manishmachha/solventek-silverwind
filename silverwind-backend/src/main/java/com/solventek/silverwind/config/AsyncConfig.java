package com.solventek.silverwind.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.lang.reflect.Method;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * Async configuration for handling background tasks like resume analysis.
 * Uses a bounded queue with CallerRunsPolicy to prevent task rejection under
 * high load.
 */
@Configuration
@EnableAsync
@Slf4j
public class AsyncConfig implements AsyncConfigurer {

    /**
     * Primary async executor for resume analysis tasks.
     * Configuration:
     * - Core pool: 5 threads (always available)
     * - Max pool: 20 threads (scales up under load)
     * - Queue capacity: 100 (buffer for burst traffic)
     * - CallerRunsPolicy: If queue is full, task runs in calling thread (prevents
     * rejection)
     */
    @Bean(name = "analysisExecutor")
    public ThreadPoolTaskExecutor analysisExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("analysis-");
        executor.setKeepAliveSeconds(60);
        // Critical: CallerRunsPolicy ensures task never fails - if queue is full,
        // it runs in the calling thread (slows down but doesn't reject)
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        log.info("Analysis ThreadPoolTaskExecutor initialized - Core: {}, Max: {}, Queue: {}",
                executor.getCorePoolSize(), executor.getMaxPoolSize(), 100);
        return executor;
    }

    /**
     * Default async executor for other async tasks.
     */
    @Override
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    /**
     * Exception handler for async methods.
     * Logs errors but doesn't propagate to caller (async is fire-and-forget).
     */
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return new AsyncExceptionHandler();
    }

    /**
     * Custom exception handler that logs async errors without crashing.
     */
    @Slf4j
    private static class AsyncExceptionHandler implements AsyncUncaughtExceptionHandler {
        @Override
        public void handleUncaughtException(Throwable ex, Method method, Object... params) {
            log.error("Async method '{}' failed with exception: {} - Params: {}",
                    method.getName(),
                    ex.getMessage(),
                    params,
                    ex);
            // Don't rethrow - analysis failure shouldn't affect application flow
        }
    }
}
