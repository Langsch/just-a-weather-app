# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Capacitor lê as anotações dos plugins por reflexão (ex.: as permissões em
# @CapacitorPlugin). No modo completo do R8 elas somem sem estas regras, e o
# pedido de permissão do GPS nunca aparece.
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault
-keep @interface com.getcapacitor.annotation.** { *; }
-keep @interface com.getcapacitor.NativePlugin { *; }
-keep @interface com.getcapacitor.PluginMethod { *; }
