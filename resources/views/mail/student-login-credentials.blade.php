<x-mail::message>
# Your {{ $appName }} student login

Hello {{ $userName }},

An administrator sent you credentials so you can sign in.

<x-mail::panel>
**Login URL:** [{{ $loginUrl }}]({{ $loginUrl }})  
**Email (sign-in username):** {{ $email }}  
**Password:** {{ $plainPassword }}
</x-mail::panel>

For security, consider changing your password after you sign in.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
