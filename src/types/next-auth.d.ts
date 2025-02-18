import 'next-auth'
import { Modern_Antiqua } from 'next/font/google'

declare module 'next-auth'{
    interface User{
        id?: String
        provider?: String
    }

    interface Session{
        user: {
            id?: String
            provider?: String
        } & DefaultSession['user']
        
    } 
}
