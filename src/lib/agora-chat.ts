
import AgoraRTM, { RtmChannel, RtmClient } from 'agora-rtm-sdk';
import { Message } from './types';
import { Timestamp } from 'firebase/firestore';

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || 'YOUR_AGORA_APP_ID'; // IMPORTANT: Replace with your Agora App ID

if (APP_ID === 'YOUR_AGORA_APP_ID') {
    console.warn('Agora App ID is not set. Please set NEXT_PUBLIC_AGORA_APP_ID in your .env.local file or replace YOUR_AGORA_APP_ID in src/lib/agora-chat.ts');
}

export const createAgoraClient = (userId: string) => {
    const client = AgoraRTM.createInstance(APP_ID);
    
    client.login({ uid: userId })
        .then(() => console.log(`Agora RTM client logged in as ${userId}`))
        .catch(err => console.error('Agora RTM login failed', err));

    return client;
};

export const createAgoraChannel = async (client: RtmClient, channelId: string, onMessageReceived: (message: Message) => void): Promise<RtmChannel> => {
    const channel = client.createChannel(channelId);

    await channel.join();
    console.log(`Joined Agora channel ${channelId}`);
    
    channel.on('ChannelMessage', (message, memberId) => {
        if (message.messageType === 'TEXT') {
            try {
                const parsedMessage = JSON.parse(message.text);
                onMessageReceived(parsedMessage);
            } catch (error) {
                console.error('Failed to parse incoming Agora message:', error);
            }
        }
    });

    return channel;
};
