package com.wdtt.client

import android.os.Build
import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat

// ═══ Inter Font Family ═══
val InterFontFamily = FontFamily(
    Font(R.font.inter_regular, FontWeight.Normal),
    Font(R.font.inter_medium, FontWeight.Medium),
    Font(R.font.inter_semibold, FontWeight.SemiBold),
    Font(R.font.inter_bold, FontWeight.Bold),
)

// ═══ Типография на Inter ═══
val WDTTTypography = Typography(
    displayLarge = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 57.sp, lineHeight = 64.sp),
    displayMedium = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 45.sp, lineHeight = 52.sp),
    displaySmall = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 36.sp, lineHeight = 44.sp),
    headlineLarge = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.SemiBold, fontSize = 32.sp, lineHeight = 40.sp),
    headlineMedium = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.SemiBold, fontSize = 28.sp, lineHeight = 36.sp),
    headlineSmall = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.SemiBold, fontSize = 24.sp, lineHeight = 32.sp),
    titleLarge = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.SemiBold, fontSize = 22.sp, lineHeight = 28.sp),
    titleMedium = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 24.sp, letterSpacing = 0.15.sp),
    titleSmall = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Medium, fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.1.sp),
    bodyLarge = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp, letterSpacing = 0.5.sp),
    bodyMedium = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.25.sp),
    bodySmall = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Normal, fontSize = 12.sp, lineHeight = 16.sp, letterSpacing = 0.4.sp),
    labelLarge = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Medium, fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.1.sp),
    labelMedium = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Medium, fontSize = 12.sp, lineHeight = 16.sp, letterSpacing = 0.5.sp),
    labelSmall = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Medium, fontSize = 11.sp, lineHeight = 16.sp, letterSpacing = 0.5.sp),
)

// ═══ Светлая палитра — «Раф на кокосовом молоке» ═══
private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF6D4C41),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFD7CCC8),
    onPrimaryContainer = Color(0xFF3E2723),
    secondary = Color(0xFF8D6E63),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFEFEBE9),
    onSecondaryContainer = Color(0xFF4E342E),
    tertiary = Color(0xFF795548),
    onTertiary = Color(0xFFFFFFFF),
    tertiaryContainer = Color(0xFFBCAAA4),
    onTertiaryContainer = Color(0xFF3E2723),
    background = Color(0xFFF2F0EC),
    onBackground = Color(0xFF1C1B1A),
    surface = Color(0xFFFAF8F4),
    onSurface = Color(0xFF1C1B1A),
    surfaceVariant = Color(0xFFEFEBE9),
    onSurfaceVariant = Color(0xFF5D4037),
    outline = Color(0xFFBCAAA4),
    outlineVariant = Color(0xFFD7CCC8),
    error = Color(0xFFBA1A1A),
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),
    inverseSurface = Color(0xFF322F2D),
    inverseOnSurface = Color(0xFFF5F0EB),
    inversePrimary = Color(0xFFD7CCC8),
    surfaceTint = Color(0xFF6D4C41),
)

// ═══ Тёмная палитра — «Эспрессо» ═══
private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFD7CCC8),
    onPrimary = Color(0xFF3E2723),
    primaryContainer = Color(0xFF5D4037),
    onPrimaryContainer = Color(0xFFEFEBE9),
    secondary = Color(0xFFBCAAA4),
    onSecondary = Color(0xFF3E2723),
    secondaryContainer = Color(0xFF4E342E),
    onSecondaryContainer = Color(0xFFEFEBE9),
    tertiary = Color(0xFFA1887F),
    onTertiary = Color(0xFF3E2723),
    tertiaryContainer = Color(0xFF5D4037),
    onTertiaryContainer = Color(0xFFEFEBE9),
    background = Color(0xFF1A1614),
    onBackground = Color(0xFFEDE0D4),
    surface = Color(0xFF211D1B),
    onSurface = Color(0xFFEDE0D4),
    surfaceVariant = Color(0xFF2C2624),
    onSurfaceVariant = Color(0xFFD7CCC8),
    outline = Color(0xFF8D6E63),
    outlineVariant = Color(0xFF4E342E),
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),
    inverseSurface = Color(0xFFEDE0D4),
    inverseOnSurface = Color(0xFF322F2D),
    inversePrimary = Color(0xFF6D4C41),
    surfaceTint = Color(0xFFD7CCC8),
)

private val IndigoLightColorScheme = lightColorScheme(
    primary = Color(0xFF5B588D),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFE2DFFF),
    onPrimaryContainer = Color(0xFF1A1744),
    secondary = Color(0xFF5B588D),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFE2DFFF),
    onSecondaryContainer = Color(0xFF1A1744),
    background = Color(0xFFFBF8FF),
    onBackground = Color(0xFF1B1B1F),
    surface = Color(0xFFF6F3FA),
    onSurface = Color(0xFF1B1B1F),
    surfaceVariant = Color(0xFFE4E1EC),
    onSurfaceVariant = Color(0xFF47464F),
    outline = Color(0xFF787680),
    outlineVariant = Color(0xFFC8C5D0),
)

private val IndigoDarkColorScheme = darkColorScheme(
    primary = Color(0xFFC4C0FF),
    onPrimary = Color(0xFF2D2A5B),
    primaryContainer = Color(0xFF434073),
    onPrimaryContainer = Color(0xFFE2DFFF),
    secondary = Color(0xFFC4C0FF),
    onSecondary = Color(0xFF2D2A5B),
    secondaryContainer = Color(0xFF434073),
    onSecondaryContainer = Color(0xFFE2DFFF),
    background = Color(0xFF131316),
    onBackground = Color(0xFFE4E1E6),
    surface = Color(0xFF1B1B1F),
    onSurface = Color(0xFFC8C5D0),
    surfaceVariant = Color(0xFF47464F),
    onSurfaceVariant = Color(0xFFC8C5D0),
    outline = Color(0xFF918F9A),
    outlineVariant = Color(0xFF47464F),
)

private val ForestLightColorScheme = lightColorScheme(
    primary = Color(0xFF5F5D68),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFE5E0F0),
    onPrimaryContainer = Color(0xFF1C1A23),
    secondary = Color(0xFF5F5D68),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFE5E0F0),
    onSecondaryContainer = Color(0xFF1C1A23),
    background = Color(0xFFFCF8FF),
    onBackground = Color(0xFF1D1B20),
    surface = Color(0xFFF7F2FA),
    onSurface = Color(0xFF1D1B20),
    surfaceVariant = Color(0xFFE6E0E9),
    onSurfaceVariant = Color(0xFF48454E),
    outline = Color(0xFF79747E),
    outlineVariant = Color(0xFFCAC4D0),
)

private val ForestDarkColorScheme = darkColorScheme(
    primary = Color(0xFFC8C4D3),
    onPrimary = Color(0xFF312F38),
    primaryContainer = Color(0xFF474550),
    onPrimaryContainer = Color(0xFFE5E0F0),
    secondary = Color(0xFFC8C4D3),
    onSecondary = Color(0xFF312F38),
    secondaryContainer = Color(0xFF474550),
    onSecondaryContainer = Color(0xFFE5E0F0),
    background = Color(0xFF141318),
    onBackground = Color(0xFFE6E1E5),
    surface = Color(0xFF1D1B20),
    onSurface = Color(0xFFCAC4D0),
    surfaceVariant = Color(0xFF48454E),
    onSurfaceVariant = Color(0xFFCAC4D0),
    outline = Color(0xFF938F99),
    outlineVariant = Color(0xFF48454E),
)

// ═══ Черно-нежно-розовая палитра — «WVF Pink Noir» ═══
private val PinkNoirDarkColorScheme = darkColorScheme(
    primary = Color(0xFFFF5C8A),
    onPrimary = Color(0xFF0F0108),
    primaryContainer = Color(0xFF380C1D),
    onPrimaryContainer = Color(0xFFFFDDE6),
    secondary = Color(0xFFFF8DA1),
    onSecondary = Color(0xFF240311),
    secondaryContainer = Color(0xFF2E1321),
    onSecondaryContainer = Color(0xFFFFDBE3),
    tertiary = Color(0xFFFF4081),
    onTertiary = Color(0xFF1B020E),
    tertiaryContainer = Color(0xFF420F28),
    onTertiaryContainer = Color(0xFFFFDDE6),
    background = Color(0xFF07060A),
    onBackground = Color(0xFFFDEEF3),
    surface = Color(0xFF0F0E16),
    onSurface = Color(0xFFFDEEF3),
    surfaceVariant = Color(0xFF1B1724),
    onSurfaceVariant = Color(0xFFE5BCCD),
    outline = Color(0xFF7A3654),
    outlineVariant = Color(0xFF2E1C27),
    error = Color(0xFFFF5277),
    onError = Color(0xFF3B0005),
    errorContainer = Color(0xFF5C000C),
    onErrorContainer = Color(0xFFFFDAD6),
    inverseSurface = Color(0xFFFDEEF3),
    inverseOnSurface = Color(0xFF0F0E16),
    inversePrimary = Color(0xFFD84A74),
    surfaceTint = Color(0xFFFF5C8A),
)

private val PinkNoirLightColorScheme = lightColorScheme(
    primary = Color(0xFFD84A74),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFFFD9E2),
    onPrimaryContainer = Color(0xFF3F0018),
    secondary = Color(0xFFBA5474),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFFFD9E2),
    onSecondaryContainer = Color(0xFF350013),
    background = Color(0xFFFFF8F9),
    onBackground = Color(0xFF22191D),
    surface = Color(0xFFFFF1F4),
    onSurface = Color(0xFF22191D),
    surfaceVariant = Color(0xFFF3DDE3),
    onSurfaceVariant = Color(0xFF514347),
    outline = Color(0xFF837378),
    outlineVariant = Color(0xFFD6C2C7),
)

private fun getAppColorScheme(palette: String, isDark: Boolean): androidx.compose.material3.ColorScheme {
    return when (palette) {
        "espresso" -> if (isDark) DarkColorScheme else LightColorScheme
        "forest" -> if (isDark) ForestDarkColorScheme else ForestLightColorScheme
        "indigo" -> if (isDark) IndigoDarkColorScheme else IndigoLightColorScheme
        else -> if (isDark) PinkNoirDarkColorScheme else PinkNoirLightColorScheme // "pink_noir" по умолчанию
    }
}

// ═══ Расширенные цвета для кастомных элементов ═══
object WDTTColors {
    // Нежный розовый акцент и свечение WVF WD
    val pinkAccent = Color(0xFFFF8DA1)
    val pinkGlow = Color(0x66FF8DA1)
    val pinkSoftContainer = Color(0xFF2B1320)

    // Статус: подключено
    val connected = Color(0xFF34D399)

    // Статус: предупреждение
    val warning = Color(0xFFFBBF24)

    // Терминал (логи WVF WD)
    val terminalBg = Color(0xFF0F0E15)
    val terminalBgDark = Color(0xFF07060A)
    val terminalText = Color(0xFFF6E7ED)
    val terminalGreen = Color(0xFF34D399)
    val terminalBlue = Color(0xFF60A5FA)
    val terminalPink = Color(0xFFFF8DA1)
    val terminalRed = Color(0xFFFF6B6B)
    val terminalCounter = Color(0xFFF472B6)
}

@Composable
fun WDTTTheme(
    themeMode: String = "dark",
    dynamicColor: Boolean = false,
    themePalette: String = "pink_noir",
    content: @Composable () -> Unit
) {
    val darkTheme = when (themeMode) {
        "dark" -> true
        "light" -> false
        else -> isSystemInDarkTheme()
    }

    val colorScheme = when {
        dynamicColor && !darkTheme && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            dynamicLightColorScheme(context)
        }
        else -> getAppColorScheme(themePalette, darkTheme)
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            val navigationBarColor = if (darkTheme) {
                Color.Transparent
            } else {
                lerp(colorScheme.background, colorScheme.surface, 0.55f)
            }
            window.statusBarColor = Color.Transparent.toArgb()
            window.navigationBarColor = navigationBarColor.toArgb()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                window.isNavigationBarContrastEnforced = false
                window.isStatusBarContrastEnforced = false
            }
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = WDTTTypography,
        content = content
    )
}
