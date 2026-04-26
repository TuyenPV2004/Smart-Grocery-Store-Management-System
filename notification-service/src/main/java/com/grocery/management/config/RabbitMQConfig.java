package com.grocery.management.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Bean
    public DirectExchange orderExchange(@Value("${app.messaging.order.exchange}") String exchangeName) {
        return new DirectExchange(exchangeName, true, false);
    }

    @Bean
    public Queue orderCreatedQueue(
            @Value("${app.messaging.order.created.queue}") String queueName,
            @Value("${app.messaging.order.created.dlq}") String deadLetterQueue) {
        return org.springframework.amqp.core.QueueBuilder.durable(queueName)
                .deadLetterExchange("")
                .deadLetterRoutingKey(deadLetterQueue)
                .build();
    }

    @Bean
    public Queue orderCreatedDeadLetterQueue(@Value("${app.messaging.order.created.dlq}") String deadLetterQueue) {
        return new Queue(deadLetterQueue, true);
    }

    @Bean
    public Binding orderCreatedBinding(
            Queue orderCreatedQueue,
            DirectExchange orderExchange,
            @Value("${app.messaging.order.created.routing-key}") String routingKey) {
        return BindingBuilder.bind(orderCreatedQueue).to(orderExchange).with(routingKey);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter messageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter);
        return rabbitTemplate;
    }
}
